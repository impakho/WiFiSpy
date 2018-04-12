#!/bin/ash

i=1
while [ "1" = "1" ]
do
if [ $i == 1 ]; then
i=6
else
if [ $i == 6 ]; then
i=11
else
if [ $i == 11 ]; then
i=1
fi
fi
fi

iw wlan2 set channel $i
sleep 5s
done
