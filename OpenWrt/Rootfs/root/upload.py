#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import sqlite3
import os
import time
import json
import socket
import traceback

device = '00:11:7F:12:73:10'
server_addr = ('103.16.85.90', 8800)
upload_interval = 15
time_offset = 3
record_filename = 'record.time'

def addr6(t_addr):
  return str(t_addr.replace(':', '').replace('-', ''))

def time8():
  return int(time.time())

def readFile(filename):
  if os.path.exists(filename):
    open_file = open(filename, 'r')
    return open_file.read()
  return ''

def handler():
  global device, server_addr, time_offset, record_filename
  upload_list = []

  try:
    tcpClientSocket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    tcpClientSocket.settimeout(5)
    tcpClientSocket.connect(server_addr)
    time.sleep(0.5)
  except:
    print 'Connect Timeout'
    traceback.print_exc()
    return

  record_time = readFile(record_filename)
  record_file = open(record_filename, 'w')
  try:
    upload_all = 1
    now_time = time8()
    offset_time = now_time - time_offset
    if len(record_time) > 0:
      record_time = int(record_time)
      if record_time < offset_time: upload_all = 0
    record_file.write(str(now_time))

    upload_list.append(addr6(device))
    upload_list.append(now_time)
    con = sqlite3.connect("/tmp/wifispy.db", isolation_level=None)
    cur = con.cursor()

    # AP
    if upload_all == 0:
      cur.execute("SELECT * FROM ap WHERE time <= ? AND time > ?"
        , (offset_time, record_time, ) )
    else:
      cur.execute("SELECT * FROM ap WHERE time <= ?", (offset_time, ) )
    data = cur.fetchall()
    upload_list.append(data)

    # STA SSID
    if upload_all == 0:
      cur.execute("SELECT * FROM sta_ssid WHERE time <= ? AND time > ?" 
        , (offset_time, record_time, ) )
    else:
      cur.execute("SELECT * FROM sta_ssid WHERE time <= ?", (offset_time, ) )
    data = cur.fetchall()
    upload_list.append(data)

    # STA ACTION
    cur.execute("SELECT * FROM sta_action")
    data = cur.fetchall()
    upload_list.append(data)
    for row in data:
      cur.execute("DELETE FROM sta_action WHERE hash = ?", (row[6], ) )

    cur.close()
    con.close()

    tcpClientSocket.sendall(json.dumps(upload_list).replace(" ","")+"\n")
    tcpClientSocket.close()
    print 'Succ'
  except:
    print 'MySQL Err'
    traceback.print_exc()
    pass
  finally:
    record_file.close()

if __name__ == '__main__':
  while True:
    print time.strftime('%Y-%m-%d %X',time.localtime())
    handler()
    time.sleep(upload_interval)
