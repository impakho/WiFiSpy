<?php
include 'init.php';

// 判断是否为MAC地址
function isMAC($str_addr){
  if (strlen($str_addr) != 12) return false;
  if (!preg_match("/^[0-9a-zA-Z]{1,12}$/i",$str_addr)) return false;
  return true;
}

// 获取所有局端设备
function getDeviceByAll(){
  $ret=array();
  $result=RunDB("SELECT * FROM device_info");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      array_push($ret,$row);
    }
  }
  return $ret;
}

// 获取中心点范围内的局端设备
function getDeviceByCircle($circle){
  $ret=array();
  $result=RunDB("SELECT * FROM device_info");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $point=array();
      array_push($point,$row['lng'],$row['lat']);
      if (isPointInCircle($point,$circle)){
        array_push($ret,$row);
      }
    }
  }
  return $ret;
}

// 获取自定义范围内的局端设备
function getDeviceByPolygon($polygon){
  $ret=array();
  $result=RunDB("SELECT * FROM device_info");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $point=array();
      array_push($point,$row['lng'],$row['lat']);
      if (isPointInPolygon($point,$polygon)){
        array_push($ret,$row);
      }
    }
  }
  return $ret;
}

// 获取指定局端设备
function getDeviceByDevices($devices){
  $ret=array();
  if (count($devices)<=0) return $ret;
  foreach ($devices as $device){
    $result=RunDB("SELECT * FROM device_info WHERE device='".$device."'");
    if (mysql_num_rows($result)>0){
      while ($row=mysql_fetch_assoc($result)){
        array_push($ret,$row);
      }
    }
  }
  return $ret;
}

// 获取所有无线热点设备
function getAPByAll($state){
  $ret=array();
  $aps=array();
  $state_sql="";
  if ($state==2) $state_sql=" AND ap_info.state = 1";
  if ($state==3) $state_sql=" AND ap_info.state = 0";
  $result=RunDB("SELECT * FROM device_info INNER JOIN ap_id ON device_info.device = ap_id.device INNER JOIN ap_info ON ap_id.id = ap_info.id".$state_sql." ORDER BY bssid");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      array_push($aps,$row);
    }
  }
  $p_ap=null;
  if (count($aps)<=0) return $ret;
  foreach ($aps as $ap){
    if ($p_ap==null){
      $p_ap=$ap;
      continue;
    }
    if ($ap['bssid']==$p_ap['bssid']){
      if ($ap['rssi']<$p_ap['rssi']) $p_ap=$ap;
      continue;
    }
    @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
    $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
    $p_ap['lng_ap']=$p_ap['lng'];
    $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
    array_push($ret,$p_ap);
    $p_ap = $ap;
  }
  @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
  $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
  $p_ap['lng_ap']=$p_ap['lng'];
  $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
  array_push($ret,$p_ap);
  return $ret;
}

// 获取中心点范围内的无线热点设备
function getAPByCircle($state, $circle){
  $ret=array();
  $aps=array();
  $state_sql="";
  if ($state==2) $state_sql=" AND ap_info.state = 1";
  if ($state==3) $state_sql=" AND ap_info.state = 0";
  $result=RunDB("SELECT * FROM device_info INNER JOIN ap_id ON device_info.device = ap_id.device INNER JOIN ap_info ON ap_id.id = ap_info.id".$state_sql." ORDER BY bssid");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      array_push($aps,$row);
    }
  }
  $p_ap=null;
  if (count($aps)<=0) return $ret;
  foreach ($aps as $ap){
    if ($p_ap==null){
      $p_ap=$ap;
      continue;
    }
    if ($ap['bssid']==$p_ap['bssid']){
      if ($ap['rssi']<$p_ap['rssi']) $p_ap=$ap;
      continue;
    }
    @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
    $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
    $p_ap['lng_ap']=$p_ap['lng'];
    $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
    $point=array();
    array_push($point,$p_ap['lng_ap'],$p_ap['lat_ap']);
    if (isPointInCircle($point,$circle)){
      array_push($ret,$p_ap);
    }
    $p_ap = $ap;
  }
  @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
  $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
  $p_ap['lng_ap']=$p_ap['lng'];
  $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
  $point=array();
  array_push($point,$p_ap['lng_ap'],$p_ap['lat_ap']);
  if (isPointInCircle($point,$circle)){
    array_push($ret,$p_ap);
  }
  return $ret;
}

// 获取自定义范围内的无线热点设备
function getAPByPolygon($state, $polygon){
  $ret=array();
  $aps=array();
  $state_sql="";
  if ($state==2) $state_sql=" AND ap_info.state = 1";
  if ($state==3) $state_sql=" AND ap_info.state = 0";
  $result=RunDB("SELECT * FROM device_info INNER JOIN ap_id ON device_info.device = ap_id.device INNER JOIN ap_info ON ap_id.id = ap_info.id".$state_sql." ORDER BY bssid");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      array_push($aps,$row);
    }
  }
  $p_ap=null;
  if (count($aps)<=0) return $ret;
  foreach ($aps as $ap){
    if ($p_ap==null){
      $p_ap=$ap;
      continue;
    }
    if ($ap['bssid']==$p_ap['bssid']){
      if ($ap['rssi']<$p_ap['rssi']) $p_ap=$ap;
      continue;
    }
    @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
    $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
    $p_ap['lng_ap']=$p_ap['lng'];
    $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
    $point=array();
    array_push($point,$p_ap['lng_ap'],$p_ap['lat_ap']);
    if (isPointInPolygon($point,$polygon)){
      array_push($ret,$p_ap);
    }
    $p_ap = $ap;
  }
  @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
  $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
  $p_ap['lng_ap']=$p_ap['lng'];
  $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
  $point=array();
  array_push($point,$p_ap['lng_ap'],$p_ap['lat_ap']);
  if (isPointInPolygon($point,$polygon)){
    array_push($ret,$p_ap);
  }
  return $ret;
}

// 通过Devices获取无线热点设备
function getAPByDevices($devices){
  $ret=array();
  if (count($devices)<=0) return $ret;
  foreach ($devices as $device){
    $result=RunDB("SELECT * FROM device_info INNER JOIN ap_id ON device_info.device = ap_id.device INNER JOIN ap_info ON ap_id.id = ap_info.id AND ap_id.device = '".$device."'");
    if (mysql_num_rows($result)>0){
      while ($row=mysql_fetch_assoc($result)){
        @$row['ssid']=iconv("GBK","UTF-8",hexToStr($row['ssid']));
        $row['distance']=getRssiDistance($row['ch'],$row['rssi']);
        $row['lng_ap']=$row['lng'];
        $row['lat_ap']=$row['lat']-$row['distance']/111110;
        array_push($ret,$row);
      }
    }
  }
  return $ret;
}

// 通过Bssids获取无线热点设备
function getAPByBssids($state, $bssids){
  $ret=array();
  $aps=array();
  $state_sql="";
  if ($state==2) $state_sql=" AND ap_info.state = 1";
  if ($state==3) $state_sql=" AND ap_info.state = 0";
  if (count($bssids)<=0) return $ret;
  foreach ($bssids as $bssid){
    $result=RunDB("SELECT * FROM device_info INNER JOIN ap_id ON device_info.device = ap_id.device INNER JOIN ap_info ON ap_id.id = ap_info.id AND ap_id.bssid = '".$bssid."'".$state_sql);
    if (mysql_num_rows($result)>0){
      while ($row=mysql_fetch_assoc($result)){
        array_push($aps,$row);
      }
    }
  }
  $p_ap=null;
  if (count($aps)<=0) return $ret;
  foreach ($aps as $ap){
    if ($p_ap==null){
      $p_ap=$ap;
      continue;
    }
    if ($ap['bssid']==$p_ap['bssid']){
      if ($ap['rssi']<$p_ap['rssi']) $p_ap=$ap;
      continue;
    }
    @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
    $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
    $p_ap['lng_ap']=$p_ap['lng'];
    $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
    array_push($ret,$p_ap);
    $p_ap = $ap;
  }
  @$p_ap['ssid']=iconv("GBK","UTF-8",hexToStr($p_ap['ssid']));
  $p_ap['distance']=getRssiDistance($p_ap['ch'],$p_ap['rssi']);
  $p_ap['lng_ap']=$p_ap['lng'];
  $p_ap['lat_ap']=$p_ap['lat']-$p_ap['distance']/111110;
  array_push($ret,$p_ap);
  return $ret;
}

// 通过Id获取无线热点设备的日志记录
function getAPLogById($id){
  $ret=array();
  $result=RunDB("SELECT * FROM ap_log WHERE id = '".$id."'");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      array_push($ret,$row);
    }
  }
  return $ret;
}

// 通过Bssid获取曾经连接过的用户设备
function getStaMacByBssid($bssid){
  $ret=array();
  $result=RunDB("SELECT time, mac, subtype FROM sta_action WHERE bssid = '".$bssid."' GROUP BY mac ORDER BY time DESC");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $subtype=$row['subtype'];
      if ($subtype=="0"||$subtype=="1"||$subtype=="2"||$subtype=="3"||$subtype=="10"||$subtype=="11"||$subtype=="12"){
        array_push($ret,$row);
      }
    }
  }
  return $ret;
}

// 通过Id获取曾经使用过的SSID
function getAPSsidById($id){
  $ret=array();
  $result=RunDB("SELECT * FROM ap_ssid WHERE id = '".$id."' ORDER BY pid DESC");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      @$row['ssid']=iconv("GBK","UTF-8",hexToStr($row['ssid']));
      array_push($ret,$row);
    }
  }
  return $ret;
}

// 通过Bssid获取用户设备
function getStaActionByBssid($bssid,$offset,$size,$sort,$order){
  $ret=array();

  $sql_offset=0;
  if ($offset>0) $sql_offset=$offset;
  $sql_size=5;
  if ($size>50) $sql_size=50;
  if ($size>0&&$size<=50) $sql_size=$size;
  $sql_sort="time";
  if ($sort=="subtype") $sql_sort="subtype";
  if ($sort=="distance") $sql_sort="rssi";
  $sql_order="DESC";
  if ($order=="asc") $sql_order="ASC";

  $result=RunDB("SELECT COUNT(*) FROM sta_action WHERE bssid = '".$bssid."'");
  $ret['total']=mysql_fetch_array($result)[0];
  $rows=array();
  $result=RunDB("SELECT * FROM sta_action WHERE bssid = '".$bssid."' ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size);
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $row['distance']=getRssiDistance("6",$row['rssi']);
      array_push($rows,$row);
    }
  }
  $ret['rows']=$rows;
  return $ret;
}

// 通过Macs获取用户设备
function getStaActionByMacs($macs,$times){
  $ret=array();
  $all_rows=array();
  if (count($macs)<=0) return $ret;
  if ($macs[0]=="FFFFFFFFFFFF"){
    $result=RunDB("SELECT mac FROM sta_action GROUP BY mac LIMIT 100");
    if (mysql_num_rows($result)>0){
      $macs=array();
      while ($row=mysql_fetch_assoc($result)){
        array_push($macs,$row['mac']);
      }
    }
  }
  foreach ($macs as $mac){
    $rows=array();
    $result=RunDB("SELECT sta_action.*, device_info.lng, device_info.lat FROM sta_action INNER JOIN device_info ON sta_action.device = device_info.device WHERE sta_action.mac = '".$mac."' AND sta_action.time > ".$times[0]." AND sta_action.time < ".$times[1]." ORDER BY sta_action.time");
    if (mysql_num_rows($result)>0){
      $p_row=0;
      while ($row=mysql_fetch_assoc($result)){
        if ($p_row==0){
          $p_row=$row;
          $p_row['timestart']=$p_row['time'];
          $p_row['timeend']=$p_row['time'];
          continue;
        }
        if ($p_row['device']==$row['device']){
          $p_row['rssi']=($p_row['rssi']+$row['rssi'])/2;
          $p_row['timeend']=$row['time'];
        }else{
          $p_row['distance']=getRssiDistance("6",$p_row['rssi']);
          $p_row['lng_sta']=$p_row['lng'];
          $p_row['lat_sta']=$p_row['lat']+$p_row['distance']/111110;
          array_push($rows,$p_row);
          $p_row=$row;
          $p_row['timestart']=$p_row['time'];
          $p_row['timeend']=$p_row['time'];
        }
      }
      $p_row['distance']=getRssiDistance("6",$p_row['rssi']);
      $p_row['lng_sta']=$p_row['lng'];
      $p_row['lat_sta']=$p_row['lat']+$p_row['distance']/111110;
      array_push($rows,$p_row);
    }
    array_push($all_rows,$rows);
  }
  array_push($ret,$macs);
  array_push($ret,$all_rows);
  return $ret;
}

// 通过Mac获取用户设备
function getStaActionByMac($mac,$offset,$size,$sort,$order){
  $ret=array();

  $sql_offset=0;
  if ($offset>0) $sql_offset=$offset;
  $sql_size=5;
  if ($size>50) $sql_size=50;
  if ($size>0&&$size<=50) $sql_size=$size;
  $sql_sort="time";
  if ($sort=="subtype") $sql_sort="subtype";
  if ($sort=="distance") $sql_sort="rssi";
  $sql_order="DESC";
  if ($order=="asc") $sql_order="ASC";

  $result=RunDB("SELECT COUNT(*) FROM sta_action WHERE mac = '".$mac."' AND bssid != 'ffffffffffff'"); // 此处可能导致全表搜索
  $ret['total']=mysql_fetch_array($result)[0];
  $rows=array();
  $result=RunDB("SELECT * FROM sta_action WHERE mac = '".$mac."' AND bssid != 'ffffffffffff' ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size); // 此处可能导致全表搜索
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $row['distance']=getRssiDistance("6",$row['rssi']);
      array_push($rows,$row);
    }
  }
  $ret['rows']=$rows;
  return $ret;
}

// 通过Mac获取曾经连接过的无线热点
function getStaBssidByMac($mac){
  $ret=array();
  $result=RunDB("SELECT time, bssid, subtype FROM sta_action WHERE mac = '".$mac."' GROUP BY bssid ORDER BY time DESC");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $subtype=$row['subtype'];
      if ($subtype=="0"||$subtype=="1"||$subtype=="2"||$subtype=="3"||$subtype=="10"||$subtype=="11"||$subtype=="12"){
        array_push($ret,$row);
      }
    }
  }
  return $ret;
}

// 通过Mac获取曾经连接过的SSID
function getStaSsidByMac($mac){
  $ret=array();
  $result=RunDB("SELECT * FROM sta_ssid WHERE mac = '".$mac."' ORDER BY time DESC");
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      @$row['ssid']=iconv("GBK","UTF-8",hexToStr($row['ssid']));
      array_push($ret,$row);
    }
  }
  return $ret;
}

// 综合查询局端设备
function getSearchDevice($offset,$size,$sort,$order,$search){
  $ret=array();

  $sql_offset=0;
  if ($offset>0) $sql_offset=$offset;
  $sql_size=10;
  if ($size>100) $sql_size=100;
  if ($size>0&&$size<=100) $sql_size=$size;
  $sql_sort="time";
  if ($sort=="device") $sql_sort="device";
  if ($sort=="name") $sql_sort="name";
  if ($sort=="lng") $sql_sort="lng";
  if ($sort=="lat") $sql_sort="lat";
  $sql_order="DESC";
  if ($order=="asc") $sql_order="ASC";
  $sql_count="";
  $sql_result="";
  if ($search==""){
    $sql_count="SELECT COUNT(*) FROM device_info";
    $sql_result="SELECT * FROM device_info ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size;
  }else{
    $sql_count="SELECT SUM(count_num) FROM ((SELECT COUNT(*) as count_num FROM device_info WHERE device LIKE '".$search."%') UNION (SELECT COUNT(*) as count_num FROM device_info WHERE name LIKE '".$search."%')) as count_sum";
    $sql_result="(SELECT * FROM device_info WHERE device LIKE '".$search."%') UNION (SELECT * FROM device_info WHERE name LIKE '".$search."%') ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size;
  }

  $result=RunDB($sql_count);
  $ret['total']=mysql_fetch_array($result)[0];
  $rows=array();
  $result=RunDB($sql_result);
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      array_push($rows,$row);
    }
  }
  $ret['rows']=$rows;
  return $ret;
}

// 综合查询无线热点设备
function getSearchAP($offset,$size,$sort,$order,$search){
  $ret=array();

  $sql_offset=0;
  if ($offset>0) $sql_offset=$offset;
  $sql_size=10;
  if ($size>100) $sql_size=100;
  if ($size>0&&$size<=100) $sql_size=$size;
  $sql_sort="time";
  if ($sort=="state") $sql_sort="state";
  if ($sort=="device") $sql_sort="device";
  if ($sort=="ssid") $sql_sort="ssid";
  if ($sort=="bssid") $sql_sort="bssid";
  if ($sort=="timeold") $sql_sort="timeold";
  if ($sort=="time") $sql_sort="time";
  if ($sort=="ch") $sql_sort="ch";
  if ($sort=="enc") $sql_sort="enc";
  if ($sort=="distance") $sql_sort="rssi";
  $sql_order="DESC";
  if ($order=="asc") $sql_order="ASC";
  $sql_count="";
  $sql_result="";
  if ($search==""){
    $sql_count="SELECT COUNT(*) FROM ap_id INNER JOIN ap_info ON ap_id.id = ap_info.id";
    $sql_result="SELECT ap_id.device, ap_id.time as timeold, ap_id.id, ap_id.bssid, ap_id.ssid, ap_info.* FROM ap_id INNER JOIN ap_info ON ap_id.id = ap_info.id ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size;
  }else{
    $sql_count="SELECT SUM(count_num) FROM ((SELECT COUNT(*) as count_num FROM ap_id WHERE device LIKE '".$search."%') UNION (SELECT COUNT(*) as count_num FROM ap_id WHERE bssid LIKE '".$search."%') UNION (SELECT COUNT(*) as count_num FROM ap_id WHERE ssid LIKE '".$search."%')) as count_sum";
    $sql_result="(SELECT ap_id.device, ap_id.time as timeold, ap_id.id, ap_id.bssid, ap_id.ssid, ap_info.* FROM ap_id INNER JOIN ap_info ON ap_id.id = ap_info.id WHERE device LIKE '".$search."%') UNION (SELECT ap_id.device, ap_id.time as timeold, ap_id.id, ap_id.bssid, ap_id.ssid, ap_info.* FROM ap_id INNER JOIN ap_info ON ap_id.id = ap_info.id WHERE bssid LIKE '".$search."%') UNION (SELECT ap_id.device, ap_id.time as timeold, ap_id.id, ap_id.bssid, ap_id.ssid, ap_info.* FROM ap_id INNER JOIN ap_info ON ap_id.id = ap_info.id WHERE ssid LIKE '".$search."%') ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size;
  }

  $result=RunDB($sql_count);
  $ret['total']=mysql_fetch_array($result)[0];
  $rows=array();
  $result=RunDB($sql_result);
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      @$row['ssid']=iconv("GBK","UTF-8",hexToStr($row['ssid']));
      $row['distance']=getRssiDistance($row['ch'],$row['rssi']);
      array_push($rows,$row);
    }
  }
  $ret['rows']=$rows;
  return $ret;
}

// 综合查询用户设备
function getSearchSta($offset,$size,$sort,$order,$search){
  $ret=array();

  $sql_offset=0;
  if ($offset>0) $sql_offset=$offset;
  $sql_size=10;
  if ($size>100) $sql_size=100;
  if ($size>0&&$size<=100) $sql_size=$size;
  $sql_sort="time";
  if ($sort=="device") $sql_sort="device";
  if ($sort=="mac") $sql_sort="mac";
  if ($sort=="bssid") $sql_sort="bssid";
  if ($sort=="subtype") $sql_sort="subtype";
  if ($sort=="distance") $sql_sort="rssi";
  $sql_order="DESC";
  if ($order=="asc") $sql_order="ASC";
  $sql_count="";
  $sql_result="";
  if ($search==""){
    $sql_count="SELECT COUNT(*) FROM sta_action";
    $sql_result="SELECT * FROM sta_action ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size;
  }else{
    $sql_count="SELECT SUM(count_num) FROM ((SELECT COUNT(*) as count_num FROM sta_action WHERE device LIKE '".$search."%') UNION (SELECT COUNT(*) as count_num FROM sta_action WHERE mac LIKE '".$search."%') UNION (SELECT COUNT(*) as count_num FROM sta_action WHERE bssid LIKE '".$search."%')) as count_sum";
    $sql_result="(SELECT * FROM sta_action WHERE device LIKE '".$search."%') UNION (SELECT * FROM sta_action WHERE mac LIKE '".$search."%') UNION (SELECT * FROM sta_action WHERE bssid LIKE '".$search."%') ORDER BY ".$sql_sort." ".$sql_order." LIMIT ".$sql_offset.",".$sql_size;
  }

  $result=RunDB($sql_count);
  $ret['total']=mysql_fetch_array($result)[0];
  $rows=array();
  $result=RunDB($sql_result);
  if (mysql_num_rows($result)>0){
    while ($row=mysql_fetch_assoc($result)){
      $row['distance']=getRssiDistance("6",$row['rssi']);
      array_push($rows,$row);
    }
  }
  $ret['rows']=$rows;
  return $ret;
}

// 获取局端设备数
function getStatsDevice(){
  $ret=array();
  $result=RunDB("SELECT COUNT(*) FROM device_info");
  array_push($ret,mysql_fetch_array($result)[0]);
  return $ret;
}

// 获取无线热点采集量
function getStatsAP(){
  $ret=array();
  $result=RunDB("SELECT COUNT(*) FROM ap_id");
  array_push($ret,mysql_fetch_array($result)[0]);
  return $ret;
}

// 获取用户设备日志量
function getStatsSta(){
  $ret=array();
  $result=RunDB("SELECT COUNT(*) FROM sta_action");
  array_push($ret,mysql_fetch_array($result)[0]);
  return $ret;
}
?>