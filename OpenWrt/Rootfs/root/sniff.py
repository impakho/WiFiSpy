#!/usr/bin/env python
# -*- encoding: utf-8 -*-

from scapy.all import *
import sqlite3
import binascii
import hashlib
import time
import random
import traceback

device = '00:11:7F:12:73:10'
wlan_iface = 'wlan2'
ignore_ap = []
ap_refresh = 90
ap_ttl = 300

ap_list = []
ssid_hash_list = []

con = sqlite3.connect("/tmp/wifispy.db", isolation_level=None)
cur = con.cursor()

cur.executescript("""
  CREATE TABLE IF NOT EXISTS ap(
    pid INTEGER PRIMARY KEY,
    time INT NOT NULL,
    id char(16) NOT NULL,
    bssid char(12) NOT NULL,
    ssid char(64) NOT NULL,
    ch INT NOT NULL,
    enc INT NOT NULL,
    state INT NOT NULL,
    rssi INT NOT NULL);""")

cur.executescript("""
  CREATE INDEX IF NOT EXISTS time
    ON ap (time);""")

cur.executescript("""
  CREATE UNIQUE INDEX IF NOT EXISTS id
    ON ap (id);""")

cur.executescript("""
  CREATE TABLE IF NOT EXISTS sta_ssid(
    pid INTEGER PRIMARY KEY,
    time INT NOT NULL,
    mac char(12) NOT NULL,
    ssid char(64) NOT NULL,
    hash char(16) NOT NULL);""")

cur.executescript("""
  CREATE INDEX IF NOT EXISTS time
    ON sta_ssid (time);""")

cur.executescript("""
  CREATE UNIQUE INDEX IF NOT EXISTS hash
    ON sta_ssid (hash);""")

cur.executescript("""
  CREATE TABLE IF NOT EXISTS sta_action(
    pid INTEGER PRIMARY KEY,
    time INT NOT NULL,
    mac char(12) NOT NULL,
    bssid char(12) NOT NULL,
    subtype INT NOT NULL,
    rssi INT NOT NULL,
    hash char(16) NOT NULL);""")

cur.executescript("""
  CREATE UNIQUE INDEX IF NOT EXISTS hash
    ON sta_action (hash);""")

def addr6(t_addr):
  return str(t_addr.replace(':', '').replace('-', ''))

def hex2(t_hex):
  try:
    return str(binascii.b2a_hex(t_hex.decode("utf8").encode("gbk")))
  except:
    pass
  try:
    return str(binascii.b2a_hex(t_hex.encode("gbk")))
  except:
    pass
  return str(binascii.b2a_hex(t_hex))

def hash16(t_hash):
  md5util = hashlib.md5()
  md5util.update(t_hash)
  return str(md5util.hexdigest()[16:])

def time8():
  return int(time.time())

cur.execute("SELECT * FROM ap")
data = cur.fetchall()
for row in data:
  ap_row = []
  ap_row.append(time8())
  for item in row: ap_row.append(item)
  ap_list.append(ap_row)

cur.execute("SELECT hash FROM sta_ssid")
data = cur.fetchall()
for row in data: ssid_hash_list.append(row[0])

def AP_Handler(l): # [bssid, ssid, ch, enc, rssi]
  print '[AP]', l
  try:
    global device, ap_list, ap_refresh, ap_ttl, cur
    bssid = addr6(l[0])
    ssid = hex2(l[1])
    cid = hash16(addr6(device)+bssid)
    new_row = [0, time8(), time8(), cid, bssid, ssid, l[2], l[3], 1, l[4]]
    insert = 1
    i = 0
    for row in ap_list:
      if row[3] == cid:
        insert = 0
        update = 0
        ap_list[i][1] = new_row[1]
        for j in range(6, 9):
          if new_row[j] != ap_list[i][j]:
            update = 1
            break
        if (ap_list[i][2]+ap_refresh) < new_row[2]: update = 1
        if update == 1:
          cur.execute("UPDATE ap SET time = ?, ch = ?, enc = ?, state = ?"
            ", rssi = ? WHERE id = ?", (new_row[2], new_row[6], new_row[7]
            , new_row[8], new_row[9], ap_list[i][3], ) )
          ap_list[i][2] = new_row[2]
          for k in range(6, 10):
            ap_list[i][k] = new_row[k]
      if ap_list[i][8] == 1 and ((ap_list[i][1]+ap_ttl) < new_row[1]):
        cur.execute("UPDATE ap SET time = ?, state = ? WHERE id = ?"
          , (new_row[2], 0, ap_list[i][3], ) )
        ap_list[i][2] = new_row[2]
        ap_list[i][8] = 0
      i = i + 1
    if insert == 1:
      cur.execute("INSERT INTO ap values (NULL, ?, ?, ?, ?, ?, ?, ?, ?)"
        , (new_row[2], new_row[3], new_row[4], new_row[5], new_row[6]
        , new_row[7], new_row[8], new_row[9], ) )
      ap_list.append(new_row)
  except Exception, e:
    traceback.print_exc()
    pass

def STA_SSID_Handler(l): # [mac, ssid]
  print '[STA_SSID]', l
  try:
    global ssid_hash_list, cur
    mac = addr6(l[0])
    ssid = hex2(l[1])
    new_row = [0, time8(), mac, ssid, hash16(mac+ssid)]
    if new_row[4] not in ssid_hash_list:
      cur.execute("INSERT INTO sta_ssid values(NULL, ?, ?, ?, ?)", (new_row[1]
        , new_row[2], new_row[3], new_row[4], ) )
      ssid_hash_list.append(new_row[4])
  except Exception, e:
    traceback.print_exc()
    pass

def STA_ACTION_Handler(l): # [mac, bssid, subtype, rssi]
  print '[STA_ACTION]', l
  try:
    global cur
    mac = addr6(l[0])
    bssid = addr6(l[1])
    new_row = [0, time8(), mac, bssid, l[2], l[3]
      , hash16(str(time8())+mac+str(random.uniform(1, 8)))]
    cur.execute("INSERT INTO sta_action values(NULL, ?, ?, ?, ?, ?, ?)"
      , (new_row[1], new_row[2], new_row[3], new_row[4], new_row[5]
      , new_row[6], ) )
  except Exception, e:
    traceback.print_exc()
    pass

def handler(p):
  if not p.haslayer(Dot11): return

  # AP from beacon & probe response
  if p.haslayer(Dot11Beacon) or p.haslayer(Dot11ProbeResp):
    try:
      global ignore_ap
      if not p[Dot11].addr3 in ignore_ap:
        bssid = str(p[Dot11].addr3)
        ssid = str(p[Dot11Elt].info)
        ch = int(ord(p[Dot11Elt:3].info))
        capability = p.sprintf("{Dot11Beacon:%Dot11Beacon.cap%}\
          {Dot11ProbeResp:%Dot11ProbeResp.cap%}")
        if re.search("privacy", capability):
          enc = 1
        else:
          enc = 0
        rssi = int(abs(ord(p.notdecoded[-2:-1])-256))
        AP_Handler([bssid, ssid, ch, enc, rssi])
    except:
      traceback.print_exc()
      pass

  # STA SSID from probe request
  if p.haslayer(Dot11ProbeReq):
    try:
      if len(p[Dot11Elt].info) > 0:
        mac = str(p[Dot11].addr2)
        ssid = str(p[Dot11Elt].info)
        STA_SSID_Handler([mac, ssid])
    except:
      traceback.print_exc()
      pass

  # STA ACTION from other
  if p.type == 0:
    try:
      if p.subtype in [0, 2, 4, 10, 11, 12]:
        mac = str(p[Dot11].addr2)
        bssid = str(p[Dot11].addr3)
        subtype = int(p.subtype)
        rssi = int(abs(ord(p.notdecoded[-2:-1])-256))
        STA_ACTION_Handler([mac, bssid, subtype, rssi])
      if p.subtype in [1, 3, 5]:
        mac = str(p[Dot11].addr1)
        bssid = str(p[Dot11].addr3)
        subtype = int(p.subtype)
        rssi = int(abs(ord(p.notdecoded[-2:-1])-256))
        STA_ACTION_Handler([mac, bssid, subtype, rssi])
    except:
      traceback.print_exc()
      pass


if __name__ == '__main__':
  sniff(iface=wlan_iface, prn=handler, store=0)
