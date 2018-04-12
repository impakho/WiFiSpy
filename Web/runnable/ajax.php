<?php
include 'do.php';
OpenDB();

$res=array();
@$p_action=$_POST['action'];
switch ($p_action) {
  case 'device_all':
    $res=getDeviceByAll();
    break;

  case 'device_circle':
    @$p_circle=$_POST['circle'];
    @$circle=json_decode($p_circle, true);
    $res=getDeviceByCircle($circle);
    break;

  case 'device_polygon':
    @$p_polygon=$_POST['polygon'];
    @$polygon=json_decode($p_polygon, true);
    $res=getDeviceByPolygon($polygon);
    break;

  case 'device_devices':
    @$p_devices=$_POST['devices'];
    @$devices=json_decode($p_devices, true);
    $res=getDeviceByDevices($devices);
    break;

  case 'ap_all':
    @$p_state=$_POST['state'];
    $res=getAPByAll($p_state);
    break;

  case 'ap_circle':
    @$p_state=$_POST['state'];
    @$p_circle=$_POST['circle'];
    @$circle=json_decode($p_circle, true);
    $res=getAPByCircle($p_state, $circle);
    break;

  case 'ap_polygon':
    @$p_state=$_POST['state'];
    @$p_polygon=$_POST['polygon'];
    @$polygon=json_decode($p_polygon, true);
    $res=getAPByPolygon($p_state, $polygon);
    break;

  case 'ap_devices':
    @$p_devices=$_POST['devices'];
    @$devices=json_decode($p_devices, true);
    $res=getAPByDevices($devices);
    break;

  case 'ap_bssids':
    @$p_state=$_POST['state'];
    @$p_bssids=$_POST['bssids'];
    @$bssids=json_decode($p_bssids, true);
    $res=getAPByBssids($p_state, $bssids);
    break;

  case 'ap_log':
    @$p_id=$_POST['id'];
    $res=getAPLogById($p_id);
    break;

  case 'sta_mac_bssid':
    @$p_bssid=$_POST['bssid'];
    $res=getStaMacByBssid($p_bssid);
    break;

  case 'ap_ssid':
    @$p_id=$_POST['id'];
    $res=getAPSsidById($p_id);
    break;

  case 'sta_action_bssid':
    @$p_bssid=$_POST['bssid'];
    @$p_offset=$_POST['offset'];
    @$p_size=$_POST['size'];
    @$p_sort=$_POST['sort'];
    @$p_order=$_POST['order'];
    $res=getStaActionByBssid($p_bssid, $p_offset, $p_size, $p_sort, $p_order);
    break;

  case 'sta_action_macs':
    @$p_macs=$_POST['macs'];
    @$macs=json_decode($p_macs, true);
    @$p_times=$_POST['times'];
    @$times=json_decode($p_times, true);
    $res=getStaActionByMacs($macs, $times);
    break;

  case 'sta_action_mac':
    @$p_mac=$_POST['mac'];
    @$p_offset=$_POST['offset'];
    @$p_size=$_POST['size'];
    @$p_sort=$_POST['sort'];
    @$p_order=$_POST['order'];
    $res=getStaActionByMac($p_mac, $p_offset, $p_size, $p_sort, $p_order);
    break;

  case 'sta_bssid_mac':
    @$p_mac=$_POST['mac'];
    $res=getStaBssidByMac($p_mac);
    break;

  case 'sta_ssid_mac':
    @$p_mac=$_POST['mac'];
    $res=getStaSsidByMac($p_mac);
    break;

  case 'search_device':
    @$p_offset=$_POST['offset'];
    @$p_size=$_POST['size'];
    @$p_sort=$_POST['sort'];
    @$p_order=$_POST['order'];
    @$p_search=$_POST['search'];
    $res=getSearchDevice($p_offset, $p_size, $p_sort, $p_order, $p_search);
    break;

  case 'search_ap':
    @$p_offset=$_POST['offset'];
    @$p_size=$_POST['size'];
    @$p_sort=$_POST['sort'];
    @$p_order=$_POST['order'];
    @$p_search=$_POST['search'];
    $res=getSearchAP($p_offset, $p_size, $p_sort, $p_order, $p_search);
    break;

  case 'search_sta':
    @$p_offset=$_POST['offset'];
    @$p_size=$_POST['size'];
    @$p_sort=$_POST['sort'];
    @$p_order=$_POST['order'];
    @$p_search=$_POST['search'];
    $res=getSearchSta($p_offset, $p_size, $p_sort, $p_order, $p_search);
    break;

  case 'stats_device':
    $res=getStatsDevice();
    break;

  case 'stats_ap':
    $res=getStatsAP();
    break;

  case 'stats_sta':
    $res=getStatsSta();
    break;

  default:
    break;
}
echo json_encode($res);

CloseDB();
?>