<?php
$GLOBALS["sql_con"]=NULL;

function OpenDB(){
  @$GLOBALS['sql_con']=mysql_connect("127.0.0.1","root","123456");
  if (!$GLOBALS['sql_con']) die("Could not connect: ".mysql_error());
  mysql_select_db("wifispy",$GLOBALS['sql_con']);
}

function RunDB($sql_query){
  mysql_query("SET NAMES 'utf8'");
  $result=mysql_query($sql_query);
  return $result;
}

function CloseDB(){
  mysql_close($GLOBALS['sql_con']);
}

function format_date($time){
  if (!is_numeric($time)){
    if (strpos($time,"-")===false) return '未知';
    $time=strtotime($time);
  }
  $t=time()-$time;
  $f=array(
    '31536000'=>'年',
    '2592000'=>'个月',
    '604800'=>'星期',
    '86400'=>'天',
    '3600'=>'小时',
    '60'=>'分钟',
    '1'=>'秒'
  );
  foreach ($f as $k=>$v){
    if (0 !=$c=floor($t/(int)$k)) {
      return $c.$v.'前';
    }
  }
}

function format_date_utc($time){
  if (!is_numeric($time)){
    if (strpos($time,"-")===false) return '未知';
    $time=strtotime($time);
  }
  return date('Y-m-d',$time);
}

function format_date_time_utc($time){
  if (!is_numeric($time)){
    if (strpos($time,"-")===false) return '未知';
    $time=strtotime($time);
  }
  return date('Y-m-d H:i:s',$time);
}

function isPointInCircle($point,$circle){
  $circle_point=array();
  array_push($circle_point,$circle[0],$circle[1]);
  if (getPointDistance($point,$circle_point)<=$circle[2]) return true;
  return false;
}

function isPointInPolygon($point,$polygon){
  $count=count($polygon);
  $py=$point[0];
  $px=$point[1];
  $flag=false;
  for ($i=0,$j=$count-1;$i<$count;$j=$i,$i++){
    $sy=$polygon[$i][0];
    $sx=$polygon[$i][1];
    $ty=$polygon[$j][0];
    $tx=$polygon[$j][1];
    if ($px==$sx&&$py==$sy||$px==$tx&&$py==$ty) return true;
    if ($sy<$py&&$ty>=$py||$sy>=$py&&$ty<$py){
      $x=$sx+($py-$sy)*($tx-$sx)/($ty-$sy);
      if ($x==$px) return true;
      if ($x>$px) $flag=!$flag;
    }
  }
  return $flag;
}

function getPointDistance($point1,$point2){
  $lng1=$point1[0];
  $lat1=$point1[1];
  $lng2=$point2[0];
  $lat2=$point2[1];
  $earthRadius = 6367000;
  $lat1 = ($lat1 * pi() ) / 180;
  $lng1 = ($lng1 * pi() ) / 180;
  $lat2 = ($lat2 * pi() ) / 180;
  $lng2 = ($lng2 * pi() ) / 180;
  $calcLongitude = $lng2 - $lng1;
  $calcLatitude = $lat2 - $lat1;
  $stepOne = pow(sin($calcLatitude / 2), 2) + cos($lat1) * cos($lat2) * pow(sin($calcLongitude / 2), 2);
  $stepTwo = 2 * asin(min(1, sqrt($stepOne)));
  $calculatedDistance = $earthRadius * $stepTwo;
  return round($calculatedDistance, 1);
}

function getRssiDistance($ch,$rssi){
  $freq=2437;
  switch ($ch) {
    case '1':$freq=2412;break;
    case '2':$freq=2417;break;
    case '3':$freq=2422;break;
    case '4':$freq=2427;break;
    case '5':$freq=2432;break;
    case '6':$freq=2437;break;
    case '7':$freq=2442;break;
    case '8':$freq=2447;break;
    case '9':$freq=2452;break;
    case '10':$freq=2457;break;
    case '11':$freq=2462;break;
    case '12':$freq=2467;break;
    case '13':$freq=2472;break;
    case '14':$freq=2484;break;
    default:$freq=2437;break;
  }
  $distance=(27.55-40*log10($freq)+6.7+$rssi)/20;
  $distance=sprintf("%.1f",pow(10,$distance)*1000);
  return $distance;
}

function hexToStr($hex){
  $string="";
  for($i=0;$i<strlen($hex)-1;$i+=2){
    $string.=chr(hexdec($hex[$i].$hex[$i+1]));
  }
  return $string;
}
?>