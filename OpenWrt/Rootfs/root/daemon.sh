#!/bin/ash

while true; do
  process_channel=`ps|grep channel|grep sh`
  if [ ! "$process_channel" ]; then
    /root/channel.sh &
    sleep 2
  fi
  process_sniff=`ps|grep python|grep sniff`
  if [ ! "$process_sniff" ]; then
    python /root/sniff.py &
    sleep 2
  fi
  process_upload=`ps|grep python|grep upload`
  if [ ! "$process_upload" ]; then
    python /root/upload.py &
    sleep 2
  fi
  sleep 5
done
