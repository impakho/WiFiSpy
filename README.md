# WiFiSpy
WiFi 探针系统，可用于手机、平板等移动终端设备的地理位置定位

## OpenWrt

数据采集，上传

`OpenWrt/Firmware`：OpenWrt 固件

`OpenWrt/Rootfs`：OpenWrt 文件系统

`OpenWrt/Rootfs/etc/rc.local`：开机启动脚本

`OpenWrt/Rootfs/root/channel.sh`：调整网卡工作信道

`OpenWrt/Rootfs/root/daemon.sh`：进程守护脚本

`OpenWrt/Rootfs/root/sniff.py`：数据采集脚本

`OpenWrt/Rootfs/root/upload.py`：数据上传脚本

## Server

数据接收，服务端

`Server/wifispy.py`：服务端脚本

`Server/wifispy.sql`：服务端数据库结构文件

## Web

前端 Web 界面

`Web/runnable/init.php`：Web 数据库配置文件

## 许可协议
WiFiSpy 采用 GPLv3 许可协议。查看 LICENSE 文件了解更多。