#!/usr/bin/env python
# -*- encoding: utf-8 -*-

import MySQLdb
from SocketServer import ThreadingTCPServer, StreamRequestHandler
import json
import time
import hashlib
import traceback

conn = False
cur = False

def initDB():
  global conn, cur
  try:
    conn = MySQLdb.connect(
      host = 'localhost',
      port = 3306,
      user = 'root',
      passwd = '123456',
      db = 'wifispy')
    conn.autocommit(1)
    conn.unicode_literal.charset = 'utf8'
    conn.string_decoder.charset = 'utf8'
    cur = conn.cursor()
    return True
  except:
    pass
  return False

listen_addr = ('0.0.0.0', 8800)

def hash16(t_hash):
  md5util = hashlib.md5()
  md5util.update(t_hash)
  return str(md5util.hexdigest()[16:])

def time8():
  return int(time.time())

class TCPHandler(StreamRequestHandler):
  def handle(self):
    receive_list = []
    try:
      self.data = self.rfile.readline()
      receive_list = json.loads(self.data)
      print 'Connect Device:', str(self.client_address[0]), receive_list[0]
    except:
      print 'JSON Err:', str(self.client_address[0])
      return
    global conn, cur
    try:
      cur.execute("SELECT * FROM device_info")
    except:
      if initDB() == False:
        print 'Connnect DB Err:', str(self.client_address[0])
        return
    try:
      device = receive_list[0]
      upload_time = receive_list[1]
      ap_list = receive_list[2]
      sta_ssid_list = receive_list[3]
      sta_action_list = receive_list[4]

      # Device Time Update
      cur.execute("UPDATE device_info SET time = %s WHERE device = %s"
        , (time8(), device, ) )

      # AP
      for row in ap_list:
        count = cur.execute("SELECT * FROM ap_id WHERE id = %s"
          , (row[2], ) )
        if count <= 0:
          cur.execute("INSERT INTO ap_id values(NULL, %s, %s, %s, %s"
            ", %s)", (device, row[1], row[2], row[3], row[4], ) )
          if len(row[4]) > 0:
            cur.execute("INSERT INTO ap_ssid values(NULL, %s, %s"
              ", %s)", (row[2], row[4], hash16(row[4]), ) )
          cur.execute("INSERT INTO ap_info values(NULL, %s, %s, %s, %s"
            ", %s, %s)", (row[2], row[1], row[5], row[6], row[7]
            , row[8], ) )
          cur.execute("INSERT INTO ap_log values(NULL, %s, %s, %s)"
            , (row[2], row[1], row[7], ) )
        else:
          data = cur.fetchall()
          if data[0][5] != row[4]:
            cur.execute("UPDATE ap_id SET ssid = %s WHERE id = %s"
              , (row[4], row[2], ) )
          if len(row[4]) > 0:
            count = cur.execute("SELECT * FROM ap_ssid WHERE id = %s"
              " AND hash = %s", (row[2], hash16(row[4]), ) )
            if count <= 0:
              cur.execute("INSERT INTO ap_ssid values(NULL, %s, %s"
                ", %s)", (row[2], row[4], hash16(row[4]), ) )
          cur.execute("SELECT * FROM ap_info WHERE id = %s", (row[2], ) )
          data = cur.fetchall()
          if data[0][5] != row[7]:
            cur.execute("INSERT INTO ap_log values(NULL, %s, %s, %s)"
              , (row[2], row[1], row[7], ) )
          cur.execute("UPDATE ap_info SET time = %s, ch = %s, enc = %s"
            ", state = %s, rssi = %s WHERE id = %s", (row[1], row[5]
            , row[6], row[7], row[8], row[2], ) )

      # STA SSID
      for row in sta_ssid_list:
        count = cur.execute("SELECT * FROM sta_ssid WHERE hash = %s"
          , (row[4], ) )
        if count <= 0:
          cur.execute("INSERT INTO sta_ssid values(NULL, %s, %s, %s"
            ", %s)", (row[1], row[2], row[3], row[4], ) )

      # STA ACTION
      for row in sta_action_list:
        cur.execute("INSERT INTO sta_action values(NULL, %s, %s, %s"
          ", %s, %s, %s)", (device, row[1], row[2], row[3], row[4]
          , row[5], ) )

      print 'Succ:', str(self.client_address[0]), time.strftime('%Y-%m-%d %X',time.localtime())

    except:
      traceback.print_exc()
      print 'MySQL Err:', str(self.client_address[0])
      pass

if __name__ == "__main__":
  initDB()
  server = ThreadingTCPServer(listen_addr, TCPHandler)
  server.serve_forever()
