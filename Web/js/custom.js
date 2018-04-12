var mySwiper;

// 页面加载完毕执行函数
window.onload = function(){
  // 初始化主界面翻页
  mySwiper = new Swiper('.swiper-container');
  mySwiper.disableTouchControl();

  // 初始化用户搜索对话框的日期时间选择器
  $("#getsta_datetime_start").datetimepicker({
    format: 'yyyy-mm-dd hh:ii',
    language: 'zh-CN'
  }).on("click", function(){
    $("#getsta_datetime_start").datetimepicker("setEndDate",$("#getsta_datetime_end").val());
  });
  $("#getsta_datetime_end").datetimepicker({
    format: 'yyyy-mm-dd hh:ii',
    language: 'zh-CN'
  }).on("click", function(){
    $("#getsta_datetime_end").datetimepicker("setStartDate",$("#getsta_datetime_start").val());
  });

  // 重置坐标转换对话框控件（针对IE）
  $("#modal_geo input[name='text1']").val("");
  $("#geo_option1_2").removeAttr('checked');
  $("#geo_option1_3").removeAttr('checked');
  $("#modal_geo input[name='text2']").val("");
  $("#modal_geo input[name='text3']").val("");
  $("#modal_geo input[name='text4']").val("");
};

// 判断是否为局端标记
function isDeviceOverlay(overlay){
  for (var device in marker_device){
    if (marker_device[device]["overlay"] == overlay) return true;
  }
  return false;
}

// 判断是否为无线热点标记
function isAPOverlay(overlay){
  for (var id in marker_ap){
    if (marker_ap[id]["overlay"] == overlay) return true;
  }
  return false;
}

// 判断是否为用户标记
function isStaOverlay(overlay){
  for (var sta in marker_sta){
    for (var rows in marker_sta[sta]){
      for (var row in marker_sta[sta][rows]){
        if (marker_sta[sta][rows][row]["overlay"] == overlay){
          return true;
        }
      }
    }
  }
  return false;
}


// 删除系统标记
function delSystemOverlay(overlay){
  delDeviceOverlay(overlay);
  delAPOverlay(overlay);
  delStaOverlay(overlay);
}

// 删除局端标记
function delDeviceOverlay(overlay){
  for (var device in marker_device){
    if (marker_device[device]["overlay"] == overlay){
      delete marker_device[device];
    }
  }
}

// 删除无线热点标记
function delAPOverlay(overlay){
  for (var id in marker_ap){
    if (marker_ap[id]["overlay"] == overlay){
      delete marker_ap[id];
    }
  }
}

// 删除用户标记
function delStaOverlay(overlay){
  if (overlay.lQ == "Marker"){
    var del_flag = 0;
    for (var sta in marker_sta){
      for (var rows in marker_sta[sta]){
        for (var row in marker_sta[sta][rows]){
          if (marker_sta[sta][rows][row]["overlay"] == overlay){
            for (var row_del in marker_sta[sta][rows]){
              var overlay_del = marker_sta[sta][rows][row_del]["overlay"];
              if (overlay_del != overlay) map.removeOverlay(overlay_del);
            }
            del_flag = 1;
          }
          if (del_flag == 1) break;
        }
        if (del_flag == 1){
          delete marker_sta[sta][rows];
          map.removeOverlay(polyline_sta[sta][rows]);
          delete polyline_sta[sta][rows];
        }
      }
      if (del_flag == 1) break;
    }
  }
  if (overlay.lQ == "Polyline"){
    var del_flag = 0;
    for (var sta in polyline_sta){
      for (var rows in polyline_sta[sta]){
        if (polyline_sta[sta][rows] == overlay){
          for (var row_del in marker_sta[sta][rows]){
            var overlay_del = marker_sta[sta][rows][row_del]["overlay"];
            map.removeOverlay(overlay_del);
          }
          del_flag = 1;
          delete polyline_sta[sta][rows];
          delete marker_sta[sta][rows];
        }
        if (del_flag == 1) break;
      }
      if (del_flag == 1) break;
    }
  }
}

/**
  * 覆盖物右键菜单 */

  $('#map-container').contextmenu({
    target: '#context-menu', 
    before: function(e,context) {
      switch (mapRightClick_overlay.lQ){
        default:
          break;
      }
    },
    onItem: function(context,e) {
      switch ($(e.target).attr("value")) {
        case "del":
          delSystemOverlay(mapRightClick_overlay);
          map.removeOverlay(mapRightClick_overlay);
          mapRightClick_overlay = null;
          break;
        default:
          break;
      }
    }
  });


/**
  * 局端搜索对话框 */

  // Vue实例化
  new Vue({
    el: '#modal_getdevice',
    methods: {
      isNumber: function(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
          evt.preventDefault();
        }else{
          return true;
        }
      }
    }
  });
  
  var marker_device = new Array();
  
  // 执行函数
  function getdevice(){
    var option1_val = $("#modal_getdevice input[name='getdevice_option1']:checked").val();
    var option2_val = $("#modal_getdevice input[name='getdevice_option2']:checked").val();
    // 重置数据，清空数组
    if (option2_val == 2){
      for (var device in marker_device) map.removeOverlay(marker_device[device]["overlay"]);
      marker_device = [];
    }
  
    // 全部范围
    if (option1_val == 1){
      $.post("/runnable/ajax.php", {action: 'device_all'}, function(result){
        var res = JSON.parse(result);
        var count = 0;
        var min_lng = 180, max_lng = -180;
        var min_lat = 90, max_lat = -90;
        for (var i in res){
          if (!marker_device.hasOwnProperty(res[i].device)){
            var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
            if (geo_point[0] < min_lng) min_lng = geo_point[0];
            if (geo_point[0] > max_lng) max_lng = geo_point[0];
            if (geo_point[1] < min_lat) min_lat = geo_point[1];
            if (geo_point[1] > max_lat) max_lat = geo_point[1];
            newdevice(res[i].device, res[i].name, geo_point[0], geo_point[1], res[i].time);
            count++;
          }
        }
        if (count == 0){
          $.bootstrapGrowl("没有变化", {type: 'info'});
        }else{
          var zoom_lng = (max_lng - min_lng) * 111110 / ($('#map-container').height() / 70);
          var zoom_lat = (max_lat - min_lat) * 111110 / ($('#map-container').height() / 70);
          var center_point = new BMap.Point((min_lng + max_lng) / 2, (min_lat + max_lat) / 2);
          if (zoom_lng > zoom_lat){
            map.centerAndZoom(center_point, zoomScale(zoom_lng));
          }else{
            map.centerAndZoom(center_point, zoomScale(zoom_lat));
          }
          $.bootstrapGrowl("新增 " + count + " 个局端设备", {type: 'success'});
        }
      });
    }
  
    // 中心点范围
    if (option1_val == 2){
      drawingManager.setDrawingMode(BMAP_DRAWING_MARKER);
      drawingManager.open();
      drawingManager.addEventListener("markercomplete", function(e, overlay) {
        drawingManager.removeEventListener("markercomplete", "getdevice_option1_val2");
        drawingManager.close()
        var lng = overlay.getPosition().lng;
        var lat = overlay.getPosition().lat;
        var geo_point = bd09towgs84([lng, lat]);
        var distance = $("#modal_getdevice input[name='text1']").val()*1000;
        var circle = new BMap.Circle(new BMap.Point(lng, lat), distance, styleOptionsBlue);
        map.addOverlay(circle);
        $.post("/runnable/ajax.php", {action: 'device_circle', circle:JSON.stringify([geo_point[0], geo_point[1], distance])}, function(result){
          var res = JSON.parse(result);
          var count = 0;
          for (var i in res){
            if (!marker_device.hasOwnProperty(res[i].device)){
              var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
              newdevice(res[i].device, res[i].name, geo_point[0], geo_point[1], res[i].time);
              count++;
            }
          }
          if (count == 0){
            $.bootstrapGrowl("没有变化", {type: 'info'});
          }else{
            $.bootstrapGrowl("新增 " + count + " 个局端设备", {type: 'success'});
          }
        });
      }, "getdevice_option1_val2");
    }
  
    // 自定义范围
    if (option1_val == 3){
      drawingManager.setDrawingMode(BMAP_DRAWING_POLYGON);
      drawingManager.open();
      drawingManager.addEventListener("polygoncomplete", function(e, overlay) {
        drawingManager.removeEventListener("polygoncomplete", "getdevice_option1_val3");
        drawingManager.close()
        var points = overlay.getPath();
        var polygon = new Array();
        for (var i in points){
          var lng = points[i].lng;
          var lat = points[i].lat;
          var geo_point = bd09towgs84([lng, lat]);
          polygon[i] = geo_point;
        }
        $.post("/runnable/ajax.php", {action: 'device_polygon', polygon: JSON.stringify(polygon)}, function(result){
          var res = JSON.parse(result);
          var count = 0;
          for (var i in res){
            if (!marker_device.hasOwnProperty(res[i].device)){
              var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
              newdevice(res[i].device, res[i].name, geo_point[0], geo_point[1], res[i].time);
              count++;
            }
          }
          if (count == 0){
            $.bootstrapGrowl("没有变化", {type: 'info'});
          }else{
            $.bootstrapGrowl("新增 " + count + " 个局端设备", {type: 'success'});
          }
        });
      }, "getdevice_option1_val3");
    }
  
    // 指定设备
    if (option1_val == 4){
      var mac = $("#modal_getdevice input[name='text2']").val();
      mac = strToMac(mac);
      $.post("/runnable/ajax.php", {action: 'device_devices', devices: JSON.stringify(mac)}, function(result){
        var res = JSON.parse(result);
        var count = 0;
        var min_lng = 180, max_lng = -180;
        var min_lat = 90, max_lat = -90;
        for (var i in res){
          if (!marker_device.hasOwnProperty(res[i].device)){
            var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
            if (geo_point[0] < min_lng) min_lng = geo_point[0];
            if (geo_point[0] > max_lng) max_lng = geo_point[0];
            if (geo_point[1] < min_lat) min_lat = geo_point[1];
            if (geo_point[1] > max_lat) max_lat = geo_point[1];
            newdevice(res[i].device, res[i].name, geo_point[0], geo_point[1], res[i].time);
            count++;
          }
        }
        if (count == 0){
          $.bootstrapGrowl("没有变化", {type: 'info'});
        }else{
          var zoom_lng = (max_lng - min_lng) * 111110 / ($('#map-container').height() / 70);
          var zoom_lat = (max_lat - min_lat) * 111110 / ($('#map-container').height() / 70);
          var center_point = new BMap.Point((min_lng + max_lng) / 2, (min_lat + max_lat) / 2);
          if (zoom_lng > zoom_lat){
            map.centerAndZoom(center_point, zoomScale(zoom_lng));
          }else{
            map.centerAndZoom(center_point, zoomScale(zoom_lat));
          }
          $.bootstrapGrowl("新增 " + count + " 个局端设备", {type: 'success'});
        }
      });
    }
  }
  
  // 新增局端数据
  function newdevice(device, name, lng, lat, time) {
    var icon = new BMap.Icon("/images/icon/0.png", new BMap.Size(26, 16));
    var marker = new BMap.Marker(new BMap.Point(lng, lat), {icon: icon});
    map.addOverlay(marker);

    var obj = {overlay: marker, device: device, name: name, lng: lng, lat: lat, time: time};
    marker_device[device] = obj;
  
    marker.addEventListener('mouseover', function () {
      //marker_device[device].setAnimation(BMAP_ANIMATION_BOUNCE);
      var lableText = "";
      if (isTimeAlive(marker_device[device]["time"])){
        lableText += "状态：<span style='color:green;'>在线</span><br/>";
      }else{
        lableText += "状态：<span style='color:red;'>离线</span><br/>";
      }
      lableText += "设备名称：" + marker_device[device]["name"] + "<br/>";
      lableText += "设备地址：" + hexToMac(marker_device[device]["device"]) + "<br/>";
      var geo_point = bd09towgs84([marker_device[device]["lng"], marker_device[device]["lat"]]);
      lableText += "经纬度：" + geo_point[0] + ", " + geo_point[1] + "<br/>";
      lableText += "最后活动时间：" + getRelativeTime(marker_device[device]["time"]) + " （" + getLocalTime(marker_device[device]["time"]) + "）";
      var position = map.pointToOverlayPixel(new BMap.Point(lng, lat));
      setLable(position.x, position.y, lableText);
    });
  
    marker.addEventListener('mouseout', function () {
      //marker_device[device].setAnimation(null);
      removeLable();
    });
  }
  
  // 鼠标停留调用函数
  function setLable(_x, _y, _lableText) {
    // 创建div元素，作为自定义标签的容器
    var div = document.createElement("div");
    // div容器ID，便于清除标签
    div.id = "divLable";
    div.style.position = "absolute";
    // 设定标签框大小颜色
    div.style.padding = "10px";
  
    div.style.background = "black";
    div.style.color = "white";
    div.style.opacity = 0.7;
    div.style.borderRadius = "10px";
    div.style.whiteSpace = "nowrap";
    div.style.fontSize = "13px";
    // 设定标签位置：鼠标所在位置
    div.style.left = _x + "px";
    div.style.top = _y + "px";
  
    //div.style.left = parseInt(_this.style.left) + parseInt(_this.style.width) * 1.2 + "px";
    //div.style.top = parseInt(_this.style.top) - parseInt(_this.style.height) / 2 + "px";
    div.innerHTML = _lableText;
    map.getPanes().markerPane.appendChild(div);
  
  }
  
  // 鼠标离开调用函数
  function removeLable() {
    if (document.getElementById("divLable")){
      map.getPanes().markerPane.removeChild(document.getElementById("divLable"));
    }
  }


/**
  * 局端操作对话框 */

  // 显示对话框函数
  function dodevice_show(){
    var show_device = "";
    for (var device in marker_device){
      if (marker_device[device]["overlay"] == mapClick_overlay){
        show_device = device;
      }
    }
    if (show_device == ""){
      $.bootstrapGrowl("错误：无法找到覆盖物", {type: 'danger'});
      return;
    }

    $('#modal_dodevice_label').html("局端设备：" + marker_device[show_device]["name"]);

    var generate_html = "";
    var device_alive = isTimeAlive(marker_device[show_device]["time"]);
    if (device_alive){
      generate_html += "<p>状态：<span style='color:green;'>在线</span></p>";
    }else{
      generate_html += "<p>状态：<span style='color:red;'>离线</span></p>";
    }
    generate_html += "<p>地址：" + hexToMac(marker_device[show_device]["device"]) + "</p>";
    var geo_point = bd09towgs84([marker_device[show_device]["lng"], marker_device[show_device]["lat"]]);
    generate_html += "<p>经纬度：" + geo_point[0] + ", " + geo_point[1] + "</p>";
    generate_html += "<p>最后活动时间：" + getRelativeTime(marker_device[show_device]["time"]) + " （" + getLocalTime(marker_device[show_device]["time"]) + "）</p>";
    generate_html += "<p class='offset_top'><h3>附近的无线热点</h3></p>";
    generate_html += "<div style='width:100%;height:290px;overflow:auto;'><table id=\"ap_table\"><thead><tr><th>SSID</th><th>BSSID</th><th>状态</th><th>频道</th><th>是否加密</th><th>最后活动时间</th><th>信号强度</th></tr></thead></table></div>";
    $('#modal_dodevice .modal-body').html(generate_html);
    $('#modal_dodevice').modal('show');
    $.post("/runnable/ajax.php", {action: 'ap_devices', devices:JSON.stringify([show_device])}, function(result){
      var res = JSON.parse(result);
      for (var i in res){
        res[i].bssid = hexToMac(res[i].bssid);
        if (res[i].ssid == "") res[i].ssid = "<i style='color:gray;'>(隐藏 )</i>";
        res[i].time = getLocalTime(res[i].time);
        if (res[i].enc == "1"){
          res[i].enc = "是";
        }else{
          res[i].enc = "否";
        }
        var new_state = "";
        if (!device_alive) new_state += "<i style='color:gray;'>未知</i>&nbsp;&nbsp;(";
        if (res[i].state == "1"){
          new_state += "<span style='color:green;'>在线</span>";
        }else{
          new_state += "<span style='color:red;'>离线</span>";
        }
        if (!device_alive) new_state += ")";
        res[i].state = new_state;
      }
      $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
      $('#modal_dodevice #ap_table').bootstrapTable({
        data: res,
        dataType: "json",
        pagination: true,
        pageSize: 5,
        pageList: [5, 10, 25, 50, 100, 'All'],
        singleSelect: false,
        sortName: "time",
        sortOrder: "desc",
        columns: [{title: 'SSID', field: 'ssid'} ,{title: 'BSSID',field: 'bssid'} ,{title: '状态',field: 'state',sortable: true} ,{title: '频道',field: 'ch',sortable: true}
          ,{title: '加密',field: 'enc',sortable: true} ,{title: '最后更新时间',field: 'time',sortable: true} ,{title: '距离(米)',field: 'distance',sortable: true}]
      });
    });
  }


/**
  * 无线热点搜索对话框 */

  // Vue实例化
  new Vue({
    el: '#modal_getap',
    methods: {
      isNumber: function(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) {
          evt.preventDefault();
        }else{
          return true;
        }
      }
    }
  });
  
  var marker_ap = new Array();
  
  // 执行函数
  function getap(){
    var option1_val = $("#modal_getap input[name='getap_option1']:checked").val();
    var option2_val = $("#modal_getap input[name='getap_option2']:checked").val();
    var option3_val = $("#modal_getap input[name='getap_option3']:checked").val();
    // 重置数据，清空数组
    if (option3_val == 2){
      for (var id in marker_ap) map.removeOverlay(marker_ap[id]["overlay"]);
      marker_ap = [];
    }
  
    // 全部范围
    if (option1_val == 1){
      $.post("/runnable/ajax.php", {action: 'ap_all', state: option2_val}, function(result){
        var res = JSON.parse(result);
        var count = 0;
        var min_lng = 180, max_lng = -180;
        var min_lat = 90, max_lat = -90;
        for (var i in res){
          if (!marker_ap.hasOwnProperty(res[i].id)){
            var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
            var geo_point_ap = wgs84tobd09([res[i].lng_ap, res[i].lat_ap]);
            if (geo_point_ap[0] < min_lng) min_lng = geo_point_ap[0];
            if (geo_point_ap[0] > max_lng) max_lng = geo_point_ap[0];
            if (geo_point_ap[1] < min_lat) min_lat = geo_point_ap[1];
            if (geo_point_ap[1] > max_lat) max_lat = geo_point_ap[1];
            newap(res[i].device, geo_point[0], geo_point[1], res[i].id, res[i].bssid, res[i].ssid, res[i].time, res[i].ch, res[i].enc, res[i].state, res[i].rssi, res[i].distance, geo_point_ap[0], geo_point_ap[1]);
            count++;
          }
        }
        if (count == 0){
          $.bootstrapGrowl("没有变化", {type: 'info'});
        }else{
          var zoom_lng = (max_lng - min_lng) * 111110 / ($('#map-container').height() / 70);
          var zoom_lat = (max_lat - min_lat) * 111110 / ($('#map-container').height() / 70);
          var center_point = new BMap.Point((min_lng + max_lng) / 2, (min_lat + max_lat) / 2);
          if (zoom_lng > zoom_lat){
            map.centerAndZoom(center_point, zoomScale(zoom_lng));
          }else{
            map.centerAndZoom(center_point, zoomScale(zoom_lat));
          }
          $.bootstrapGrowl("新增 " + count + " 个无线热点设备", {type: 'success'});
        }
      });
    }
  
    // 中心点范围
    if (option1_val == 2){
      drawingManager.setDrawingMode(BMAP_DRAWING_MARKER);
      drawingManager.open();
      drawingManager.addEventListener("markercomplete", function(e, overlay) {
        drawingManager.removeEventListener("markercomplete", "getap_option1_val2");
        drawingManager.close()
        var lng = overlay.getPosition().lng;
        var lat = overlay.getPosition().lat;
        var geo_point = bd09towgs84([lng, lat]);
        var distance = $("#modal_getap input[name='text1']").val()*1000;
        var circle = new BMap.Circle(new BMap.Point(lng, lat), distance, styleOptionsBlue);
        map.addOverlay(circle);
        $.post("/runnable/ajax.php", {action: 'ap_circle', state: option2_val, circle:JSON.stringify([geo_point[0], geo_point[1], distance])}, function(result){
          var res = JSON.parse(result);
          var count = 0;
          for (var i in res){
            if (!marker_ap.hasOwnProperty(res[i].id)){
              var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
              var geo_point_ap = wgs84tobd09([res[i].lng_ap, res[i].lat_ap]);
              newap(res[i].device, geo_point[0], geo_point[1], res[i].id, res[i].bssid, res[i].ssid, res[i].time, res[i].ch, res[i].enc, res[i].state, res[i].rssi, res[i].distance, geo_point_ap[0], geo_point_ap[1]);
              count++;
            }
          }
          if (count == 0){
            $.bootstrapGrowl("没有变化", {type: 'info'});
          }else{
            $.bootstrapGrowl("新增 " + count + " 个无线热点设备", {type: 'success'});
          }
        });
      }, "getap_option1_val2");
    }
  
    // 自定义范围
    if (option1_val == 3){
      drawingManager.setDrawingMode(BMAP_DRAWING_POLYGON);
      drawingManager.open();
      drawingManager.addEventListener("polygoncomplete", function(e, overlay) {
        drawingManager.removeEventListener("polygoncomplete", "getap_option1_val3");
        drawingManager.close()
        var points = overlay.getPath();
        var polygon = new Array();
        for (var i in points){
          var lng = points[i].lng;
          var lat = points[i].lat;
          var geo_point = bd09towgs84([lng, lat]);
          polygon[i] = geo_point;
        }
        $.post("/runnable/ajax.php", {action: 'ap_polygon', state: option2_val, polygon: JSON.stringify(polygon)}, function(result){
          var res = JSON.parse(result);
          var count = 0;
          for (var i in res){
            if (!marker_ap.hasOwnProperty(res[i].id)){
              var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
              var geo_point_ap = wgs84tobd09([res[i].lng_ap, res[i].lat_ap]);
              newap(res[i].device, geo_point[0], geo_point[1], res[i].id, res[i].bssid, res[i].ssid, res[i].time, res[i].ch, res[i].enc, res[i].state, res[i].rssi, res[i].distance, geo_point_ap[0], geo_point_ap[1]);
              count++;
            }
          }
          if (count == 0){
            $.bootstrapGrowl("没有变化", {type: 'info'});
          }else{
            $.bootstrapGrowl("新增 " + count + " 个无线热点设备", {type: 'success'});
          }
        });
      }, "getap_option1_val3");
    }

    // 指定设备
    if (option1_val == 4){
      var mac = $("#modal_getap input[name='text2']").val();
      mac = strToMac(mac);
      $.post("/runnable/ajax.php", {action: 'ap_bssids', state: option2_val, bssids: JSON.stringify(mac)}, function(result){
        var res = JSON.parse(result);
        var count = 0;
        var min_lng = 180, max_lng = -180;
        var min_lat = 90, max_lat = -90;
        for (var i in res){
          if (!marker_ap.hasOwnProperty(res[i].id)){
            var geo_point = wgs84tobd09([res[i].lng, res[i].lat]);
            var geo_point_ap = wgs84tobd09([res[i].lng_ap, res[i].lat_ap]);
            if (geo_point_ap[0] < min_lng) min_lng = geo_point_ap[0];
            if (geo_point_ap[0] > max_lng) max_lng = geo_point_ap[0];
            if (geo_point_ap[1] < min_lat) min_lat = geo_point_ap[1];
            if (geo_point_ap[1] > max_lat) max_lat = geo_point_ap[1];
            newap(res[i].device, geo_point[0], geo_point[1], res[i].id, res[i].bssid, res[i].ssid, res[i].time, res[i].ch, res[i].enc, res[i].state, res[i].rssi, res[i].distance, geo_point_ap[0], geo_point_ap[1]);
            count++;
          }
        }
        if (count == 0){
          $.bootstrapGrowl("没有变化", {type: 'info'});
        }else{
          var zoom_lng = (max_lng - min_lng) * 111110 / ($('#map-container').height() / 70);
          var zoom_lat = (max_lat - min_lat) * 111110 / ($('#map-container').height() / 70);
          var center_point = new BMap.Point((min_lng + max_lng) / 2, (min_lat + max_lat) / 2);
          if (zoom_lng > zoom_lat){
            map.centerAndZoom(center_point, zoomScale(zoom_lng));
          }else{
            map.centerAndZoom(center_point, zoomScale(zoom_lat));
          }
          $.bootstrapGrowl("新增 " + count + " 个无线热点设备", {type: 'success'});
        }
      });
    }
  }
  
  var ap_temp_circle;

  // 新增无线热点数据
  function newap(device, lng, lat, id, bssid, ssid, time, ch, enc, state, rssi, distance, lng_ap, lat_ap) {
    var icon = new BMap.Icon("/images/icon/2.png", new BMap.Size(14, 14));
    var marker = new BMap.Marker(new BMap.Point(lng_ap, lat_ap), {icon: icon});
    map.addOverlay(marker);

    var obj = {overlay: marker, device: device, lng: lng, lat: lat, id: id, bssid: bssid, ssid: ssid, time: time, ch: ch, enc: enc, state: state, rssi: rssi, distance: distance, lng_ap: lng_ap, lat_ap: lat_ap};
    marker_ap[id] = obj;
  
    marker.addEventListener('mouseover', function () {
      //marker_device[device].setAnimation(BMAP_ANIMATION_BOUNCE);
      var lableText = "";
      var ap_alive = isTimeAlive(marker_ap[id]["time"]);
      lableText += "状态：";
      if (!ap_alive) lableText += "<i style='color:gray;'>未知</i>&nbsp;&nbsp;(";
      if (marker_ap[id]["state"] == "1"){
        lableText += "<span style='color:green;'>在线</span>";
      }else{
        lableText += "<span style='color:red;'>离线</span>";
      }
      if (!ap_alive) lableText += ")";
      lableText += "<br/>";
      if (marker_ap[id]["ssid"] == ""){
        lableText += "SSID：" + "<i style='color:gray;'>(隐藏 )</i><br/>";
      }else{
        lableText += "SSID：" + marker_ap[id]["ssid"] + "<br/>";
      }
      lableText += "BSSID：" + hexToMac(marker_ap[id]["bssid"]) + "<br/>";
      lableText += "局端设备：" + hexToMac(marker_ap[id]["device"]) + "<br/>";
      lableText += "距离（米）：" + marker_ap[id]["distance"] + "<br/>";
      var geo_point = bd09towgs84([marker_ap[id]["lng_ap"], marker_ap[id]["lat_ap"]]);
      lableText += "经纬度：" + geo_point[0] + ", " + geo_point[1] + "<br/>";
      lableText += "最后更新时间：" + getRelativeTime(marker_ap[id]["time"]) + " （" + getLocalTime(marker_ap[id]["time"]) + "）";
      var position = map.pointToOverlayPixel(new BMap.Point(lng_ap, lat_ap));
      setLable(position.x, position.y, lableText);
      ap_temp_circle = new BMap.Circle(new BMap.Point(lng, lat), distance, styleOptionsGray);
      map.addOverlay(ap_temp_circle);
    });
  
    marker.addEventListener('mouseout', function () {
      //marker_device[device].setAnimation(null);
      removeLable();
      map.removeOverlay(ap_temp_circle);
    });
  }
  
  // 鼠标停留调用函数
  function setLable(_x, _y, _lableText) {
    // 创建div元素，作为自定义标签的容器
    var div = document.createElement("div");
    // div容器ID，便于清除标签
    div.id = "divLable";
    div.style.position = "absolute";
    // 设定标签框大小颜色
    div.style.padding = "10px";
  
    div.style.background = "black";
    div.style.color = "white";
    div.style.opacity = 0.7;
    div.style.borderRadius = "10px";
    div.style.whiteSpace = "nowrap";
    div.style.fontSize = "13px";
    // 设定标签位置：鼠标所在位置
    div.style.left = _x + "px";
    div.style.top = _y + "px";
  
    //div.style.left = parseInt(_this.style.left) + parseInt(_this.style.width) * 1.2 + "px";
    //div.style.top = parseInt(_this.style.top) - parseInt(_this.style.height) / 2 + "px";
    div.innerHTML = _lableText;
    map.getPanes().markerPane.appendChild(div);
  
  }
  
  // 鼠标离开调用函数
  function removeLable() {
    if (document.getElementById("divLable")){
      map.getPanes().markerPane.removeChild(document.getElementById("divLable"));
    }
  }


/**
  * 无线热点操作对话框 */

  // 显示对话框函数
  function doap_show(){
    var show_ap = "";
    for (var id in marker_ap){
      if (marker_ap[id]["overlay"] == mapClick_overlay){
        show_ap = id;
      }
    }
    if (show_ap == ""){
      $.bootstrapGrowl("错误：无法找到覆盖物", {type: 'danger'});
      return;
    }

    var ap_ssid = "";
    if (marker_ap[show_ap]["ssid"] == ""){
      ap_ssid += "<i style='color:gray;'>隐藏</i>";
    }else{
      ap_ssid += marker_ap[show_ap]["ssid"];
    }
    $('#modal_doap_label').html("无线热点设备：" + ap_ssid + "（" + hexToMac(marker_ap[show_ap]["bssid"]) + "）");

    var generate_html = "";
    generate_html += "<div class='row'>";
    generate_html += "<div class='col-md-6'>";
    var ap_alive = isTimeAlive(marker_ap[show_ap]["time"]);
    generate_html += "<p>状态：";
    if (!ap_alive) generate_html += "<i style='color:gray;'>未知</i>&nbsp;&nbsp;(";
    if (marker_ap[show_ap]["state"] == "1"){
      generate_html += "<span style='color:green;'>在线</span>";
    }else{
      generate_html += "<span style='color:red;'>离线</span>";
    }
    if (!ap_alive) generate_html += ")";
    generate_html += "</p>";
    generate_html += "<p>频道：" + marker_ap[show_ap]["ch"] + "</p>";
    if (marker_ap[show_ap]["enc"] == "1"){
      generate_html += "<p>加密：是</p>";
    }else{
      generate_html += "<p>加密：否</p>";
    }
    generate_html += "<p>局端设备：" + hexToMac(marker_ap[show_ap]["device"]) + "</p>";
    generate_html += "<p>距离（米）：" + marker_ap[show_ap]["distance"] + "</p>";
    var geo_point = bd09towgs84([marker_ap[show_ap]["lng_ap"], marker_ap[show_ap]["lat_ap"]]);
    generate_html += "<p>经纬度：" + geo_point[0] + ", " + geo_point[1] + "</p>";
    generate_html += "<p>最后更新时间：" + getRelativeTime(marker_ap[show_ap]["time"]) + " （" + getLocalTime(marker_ap[show_ap]["time"]) + "）</p>";
    generate_html += "<p style='padding-top:10px;'><button class=\"btn btn-primary\" onclick=\"sta_mac_bssid_show('" + marker_ap[show_ap]["bssid"] + "');\">查看&nbsp;曾经连接过的用户设备</button>";
    generate_html += "<span class=\"offset_left\" /><button class=\"btn btn-primary\" onclick=\"ap_ssid_show('" + marker_ap[show_ap]["id"] + "');\">查看&nbsp;曾经使用过的SSID</button></p>";
    generate_html += "<div class=\"modal fade\" id=\"modal_sta_mac_bssid\" tabindex=\"9999\" role=\"dialog\" aria-labelledby=\"modal_sta_mac_bssid_label\" aria-hidden=\"true\">";
    generate_html += "  <div class=\"modal-dialog\">";
    generate_html += "    <div class=\"modal-content\">";
    generate_html += "      <div class=\"modal-header\">";
    generate_html += "        <button type=\"button\" class=\"close\" aria-hidden=\"true\" onclick=\"$('#modal_sta_mac_bssid').modal('hide');\">&times;</button>";
    generate_html += "        <h4 class=\"modal-title\" id=\"modal_sta_mac_bssid_label\">曾经连接过的用户设备</h4>";
    generate_html += "      </div>";
    generate_html += "      <div class=\"modal-body\">";
    generate_html += "        <div style='width:100%;height:460px;overflow:auto;'><table id=\"ap_sta_mac_bssid\"><thead><tr><th>曾经的活动时间（非最后的活动时间）</th><th>用户设备</th></tr></thead></table></div>";
    generate_html += "      </div>";
    generate_html += "    </div>";
    generate_html += "  </div>";
    generate_html += "</div>";
    generate_html += "<div class=\"modal fade\" id=\"modal_ap_ssid\" tabindex=\"9999\" role=\"dialog\" aria-labelledby=\"modal_ap_ssid_label\" aria-hidden=\"true\">";
    generate_html += "  <div class=\"modal-dialog\">";
    generate_html += "    <div class=\"modal-content\">";
    generate_html += "      <div class=\"modal-header\">";
    generate_html += "        <button type=\"button\" class=\"close\" aria-hidden=\"true\" onclick=\"$('#modal_ap_ssid').modal('hide');\">&times;</button>";
    generate_html += "        <h4 class=\"modal-title\" id=\"modal_ap_ssid_label\">曾经使用过的SSID</h4>";
    generate_html += "      </div>";
    generate_html += "      <div class=\"modal-body\">";
    generate_html += "        <div style='width:100%;height:460px;overflow:auto;'><table id=\"ap_ap_ssid\"><thead><tr><th>记录ID</th><th>SSID</th></tr></thead></table></div>";
    generate_html += "      </div>";
    generate_html += "    </div>";
    generate_html += "  </div>";
    generate_html += "</div>";
    generate_html += "</div>";
    generate_html += "<div class='col-md-6'>";
    generate_html += "<div style='width:100%;height:175px;overflow:auto;'><table id=\"ap_log\"><thead><tr><th>时间</th><th>状态</th></tr></thead></table></div>";
    generate_html += "</div>";
    generate_html += "</div>";
    generate_html += "<p class='offset_top'><h3>与附近用户设备的交流</h3></p>";
    generate_html += "<div style='width:100%;height:290px;overflow:auto;'><table id=\"ap_sta_action\"><thead><tr><th>时间</th><th>用户设备</th><th>无线热点设备</th><th>操作类型</th><th>距离（米）</th></tr></thead></table></div>";
    $('#modal_doap .modal-body').html(generate_html);
    $('#modal_doap').modal('show');
    $.post("/runnable/ajax.php", {action: 'ap_log', id: marker_ap[show_ap]["id"]}, function(result){
      var res = JSON.parse(result);
      for (var i in res){
        res[i].time = getLocalTime(res[i].time);
        if (res[i].active == "1"){
          res[i].active = "上线";
        }else{
          res[i].active = "下线";
        }
      }
      $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
      $('#modal_doap #ap_log').bootstrapTable({
        data: res,
        dataType: "json",
        pagination: true,
        pageSize: 2,
        pageList: [2],
        singleSelect: false,
        sortName: "time",
        sortOrder: "desc",
        columns: [{title: '时间',field: 'time',sortable: true}, {title: '状态', field: 'active'}]
      });
    });
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
    $('#modal_doap #ap_sta_action').bootstrapTable({
      dataType: "json",
      sidePagination: "server",
      ajax: function(params){
        $.post("/runnable/ajax.php", {action: 'sta_action_bssid', bssid: marker_ap[show_ap]["bssid"], offset: params.data.offset, size: params.data.limit, sort: params.data.sort, order: params.data.order}, function(result){
          var res = JSON.parse(result);
          for (var i in res['rows']){
            res['rows'][i].time = getLocalTime(res['rows'][i].time);
            res['rows'][i].mac = hexToMac(res['rows'][i].mac);
            res['rows'][i].bssid = hexToMac(res['rows'][i].bssid);
            var sta_subtype = res['rows'][i].subtype;
            if (sta_subtype == "0") res['rows'][i].subtype = "关联请求";
            if (sta_subtype == "1") res['rows'][i].subtype = "关联回应";
            if (sta_subtype == "2") res['rows'][i].subtype = "重关联请求";
            if (sta_subtype == "3") res['rows'][i].subtype = "重关联回应";
            if (sta_subtype == "4") res['rows'][i].subtype = "扫描请求";
            if (sta_subtype == "5") res['rows'][i].subtype = "扫描回应";
            if (sta_subtype == "8") res['rows'][i].subtype = "广播信标";
            if (sta_subtype == "10") res['rows'][i].subtype = "解除关联";
            if (sta_subtype == "11") res['rows'][i].subtype = "认证";
            if (sta_subtype == "12") res['rows'][i].subtype = "解除认证";
          }
          params.success(res);
        });
      },
      pagination: true,
      pageSize: 5,
      pageList: [5, 10, 25, 50],
      singleSelect: false,
      sortName: "time",
      sortOrder: "desc",
      columns: [{title: '时间',field: 'time',sortable: true}, {title: '用户设备', field: 'mac'}, {title: '无线热点设备', field: 'bssid'}, {title: '操作类型',field: 'subtype',sortable: true}, {title: '距离（米）',field: 'distance',sortable: true}]
    });
  }

  // 显示曾经连接过的用户设备对话框函数
  function sta_mac_bssid_show(bssid){
    $.post("/runnable/ajax.php", {action: 'sta_mac_bssid', bssid: bssid}, function(result){
      var res = JSON.parse(result);
      for (var i in res){
        res[i].time = getLocalTime(res[i].time);
        res[i].mac = hexToMac(res[i].mac);
      }
      $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
      $('#modal_sta_mac_bssid #ap_sta_mac_bssid').bootstrapTable({
        data: res,
        dataType: "json",
        pagination: true,
        pageSize: 8,
        pageList: [8, 10, 25, 50, 100, 'All'],
        singleSelect: false,
        sortName: "time",
        sortOrder: "desc",
        columns: [{title: '曾经的活动时间（非最后的活动时间）',field: 'time',sortable: true}, {title: '用户设备',field: 'mac'}]
      });
    });
    $('#modal_sta_mac_bssid').modal('show');
  }

  // 显示曾经使用过的SSID对话框函数
  function ap_ssid_show(id){
    $.post("/runnable/ajax.php", {action: 'ap_ssid', id: id}, function(result){
      var res = JSON.parse(result);
      $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
      $('#modal_ap_ssid #ap_ap_ssid').bootstrapTable({
        data: res,
        dataType: "json",
        pagination: true,
        pageSize: 8,
        pageList: [8, 10, 25, 50, 100, 'All'],
        singleSelect: false,
        sortName: "pid",
        sortOrder: "desc",
        columns: [{title: '记录ID',field: 'pid',sortable: true}, {title: 'SSID',field: 'ssid'}]
      });
    });
    $('#modal_ap_ssid').modal('show');
  }


/**
  * 用户搜索对话框 */
  
  var marker_sta = new Array();
  var polyline_sta = new Array();
  var temp_stroke_color;
  
  // 执行函数
  function getsta(){
    var macs = $("#modal_getsta input[name='text1']").val();
    macs = strToMac(macs);
    var times = new Array();
    times.push(getTimeStamp($("#getsta_datetime_start").val()));
    times.push(getTimeStamp($("#getsta_datetime_end").val()));
    var color = $("#modal_getsta input[name='getsta_option1']:checked").val();

    $.post("/runnable/ajax.php", {action: 'sta_action_macs', macs: JSON.stringify(macs), times: JSON.stringify(times)}, function(result){
      var res = JSON.parse(result);
      var res_macs = res[0];
      var res_rows = res[1];
      var count = 0;
      var min_lng = 180, max_lng = -180;
      var min_lat = 90, max_lat = -90;
      for (var i in res_macs){
        var objs = new Array();
        var points = new Array();
        for (var j in res_rows[i]){
          var geo_point = wgs84tobd09([res_rows[i][j]['lng'], res_rows[i][j]['lat']]);
          var geo_point_sta = wgs84tobd09([res_rows[i][j]['lng_sta'], res_rows[i][j]['lat_sta']]);
          if (geo_point_sta[0] < min_lng) min_lng = geo_point_sta[0];
          if (geo_point_sta[0] > max_lng) max_lng = geo_point_sta[0];
          if (geo_point_sta[1] < min_lat) min_lat = geo_point_sta[1];
          if (geo_point_sta[1] > max_lat) max_lat = geo_point_sta[1];
          var point = new BMap.Point(geo_point_sta[0], geo_point_sta[1]);
          points.push(point);
          var device = res_rows[i][j]['device'];
          var mac = res_rows[i][j]['mac'];
          var rssi = res_rows[i][j]['rssi'];
          var distance = res_rows[i][j]['distance'];
          var timestart = res_rows[i][j]['timestart'];
          var timeend = res_rows[i][j]['timeend'];
          var marker = newsta(device, mac, rssi, distance, geo_point[0], geo_point[1], geo_point_sta[0], geo_point_sta[1], timestart, timeend);
          var obj = {overlay: marker, device: device, mac: mac, rssi: rssi, distance: distance, lng: geo_point[0], lat: geo_point[1], lng_sta: geo_point_sta[0], lat_sta: geo_point_sta[1], timestart: timestart, timeend: timeend};
          objs.push(obj);
        }
        if (objs.length <= 0) continue;
        count++;
        var polyline;
        if (color == "2"){
          polyline = new BMap.Polyline(points, styleOptionsBlue);
        }else if (color == "3"){
          polyline = new BMap.Polyline(points, styleOptionsGreen);
        }else if (color == "4"){
          polyline = new BMap.Polyline(points, styleOptionsOrange);
        }else if (color == "5"){
          polyline = new BMap.Polyline(points, styleOptionsBlack);
        }else{
          polyline = new BMap.Polyline(points, styleOptionsRed);
        }
        polyline.addEventListener('mouseover', function (e) {
          temp_stroke_color = polyline.getStrokeColor();
          e.target.setStrokeColor("gray");
        });
        polyline.addEventListener('mouseout', function (e) {
          e.target.setStrokeColor(temp_stroke_color);
        });
        map.addOverlay(polyline);
        if (marker_sta[res_macs[i]] == null) marker_sta[res_macs[i]] = new Array();
        if (polyline_sta[res_macs[i]] == null) polyline_sta[res_macs[i]] = new Array();
        marker_sta[res_macs[i]].push(objs);
        polyline_sta[res_macs[i]].push(polyline);
      }
      if (count == 0){
        $.bootstrapGrowl("没有变化", {type: 'info'});
      }else{
        var zoom_lng = (max_lng - min_lng) * 111110 / ($('#map-container').height() / 70);
        var zoom_lat = (max_lat - min_lat) * 111110 / ($('#map-container').height() / 70);
        var center_point = new BMap.Point((min_lng + max_lng) / 2, (min_lat + max_lat) / 2);
        if (zoom_lng > zoom_lat){
          map.centerAndZoom(center_point, zoomScale(zoom_lng));
        }else{
          map.centerAndZoom(center_point, zoomScale(zoom_lat));
        }
        $.bootstrapGrowl("新增 " + count + " 个用户设备", {type: 'success'});
      }
    });
  }

  var sta_temp_circle;
  
  // 新增用户数据
  function newsta(device, mac, rssi, distance, lng, lat, lng_sta, lat_sta, timestart, timeend){
    var point = new BMap.Point(lng_sta, lat_sta);
    var icon = new BMap.Icon("/images/icon/3.png", new BMap.Size(14, 14));
    var marker = new BMap.Marker(point, {icon: icon});
    marker.addEventListener('mouseover', function () {
      //marker_device[device].setAnimation(BMAP_ANIMATION_BOUNCE);
      var lableText = "";
      lableText += "设备地址：" + hexToMac(mac) + "<br/>";
      lableText += "局端地址：" + hexToMac(device) + "<br/>";
      lableText += "距离（米）：" + distance + "<br/>";
      var geo_point = bd09towgs84([lng_sta, lat_sta]);
      lableText += "经纬度：" + geo_point[0] + ", " + geo_point[1] + "<br/>";
      lableText += "活动时间起始：" + getRelativeTime(timestart) + " （" + getLocalTime(timestart) + "）<br/>";
      lableText += "活动时间结束：" + getRelativeTime(timeend) + " （" + getLocalTime(timeend) + "）";
      var position = map.pointToOverlayPixel(new BMap.Point(lng_sta, lat_sta));
      setLable(position.x, position.y, lableText);
      sta_temp_circle = new BMap.Circle(new BMap.Point(lng, lat), distance, styleOptionsGray);
      map.addOverlay(sta_temp_circle);
    });
    marker.addEventListener('mouseout', function () {
      //marker_device[device].setAnimation(null);
      removeLable();
      map.removeOverlay(sta_temp_circle);
    });
    map.addOverlay(marker);
    return marker;
  }

  // 鼠标停留调用函数
  function setLable(_x, _y, _lableText) {
    // 创建div元素，作为自定义标签的容器
    var div = document.createElement("div");
    // div容器ID，便于清除标签
    div.id = "divLable";
    div.style.position = "absolute";
    // 设定标签框大小颜色
    div.style.padding = "10px";
  
    div.style.background = "black";
    div.style.color = "white";
    div.style.opacity = 0.7;
    div.style.borderRadius = "10px";
    div.style.whiteSpace = "nowrap";
    div.style.fontSize = "13px";
    // 设定标签位置：鼠标所在位置
    div.style.left = _x + "px";
    div.style.top = _y + "px";
  
    //div.style.left = parseInt(_this.style.left) + parseInt(_this.style.width) * 1.2 + "px";
    //div.style.top = parseInt(_this.style.top) - parseInt(_this.style.height) / 2 + "px";
    div.innerHTML = _lableText;
    map.getPanes().markerPane.appendChild(div);
  
  }
  
  // 鼠标离开调用函数
  function removeLable() {
    if (document.getElementById("divLable")){
      map.getPanes().markerPane.removeChild(document.getElementById("divLable"));
    }
  }


/**
  * 用户操作对话框 */

  // 显示对话框函数
  function dosta_show(){
    var show_sta = "";
    for (var sta in marker_sta){
      for (var rows in marker_sta[sta]){
        for (var row in marker_sta[sta][rows]){
          if (marker_sta[sta][rows][row]["overlay"] == mapClick_overlay){
            show_sta = marker_sta[sta][rows][row];
          }
        }
      }
    }
    if (show_sta == ""){
      $.bootstrapGrowl("错误：无法找到覆盖物", {type: 'danger'});
      return;
    }

    $('#modal_dosta_label').html("用户设备：" + hexToMac(show_sta["mac"]));

    var generate_html = "";
    generate_html += "<p>局端地址：" + hexToMac(show_sta["device"]) + "</p>";
    generate_html += "<p>距离（米）：" + show_sta["distance"] + "</p>";
    var geo_point = bd09towgs84([show_sta["lng_sta"], show_sta["lat_sta"]]);
    generate_html += "<p>经纬度：" + geo_point[0] + ", " + geo_point[1] + "</p>";
    generate_html += "<p>活动时间起始：" + getRelativeTime(show_sta["timestart"]) + " （" + getLocalTime(show_sta["timestart"]) + "）</p>";
    generate_html += "<p>活动时间结束：" + getRelativeTime(show_sta["timeend"]) + " （" + getLocalTime(show_sta["timeend"]) + "）</p>";
    generate_html += "<p style='padding-top:10px;'><button class=\"btn btn-primary\" onclick=\"sta_bssid_mac_show('" + show_sta["mac"] + "');\">查看&nbsp;曾经连接过的无线热点设备</button>";
    generate_html += "<span class=\"offset_left\" /><button class=\"btn btn-primary\" onclick=\"sta_ssid_mac_show('" + show_sta["mac"] + "');\">查看&nbsp;曾经连接过的SSID</button></p>";
    generate_html += "<div class=\"modal fade\" id=\"modal_sta_bssid_mac\" tabindex=\"9999\" role=\"dialog\" aria-labelledby=\"modal_sta_bssid_mac_label\" aria-hidden=\"true\">";
    generate_html += "  <div class=\"modal-dialog\">";
    generate_html += "    <div class=\"modal-content\">";
    generate_html += "      <div class=\"modal-header\">";
    generate_html += "        <button type=\"button\" class=\"close\" aria-hidden=\"true\" onclick=\"$('#modal_sta_bssid_mac').modal('hide');\">&times;</button>";
    generate_html += "        <h4 class=\"modal-title\" id=\"modal_sta_bssid_mac_label\">曾经连接过的无线热点设备</h4>";
    generate_html += "      </div>";
    generate_html += "      <div class=\"modal-body\">";
    generate_html += "        <div style='width:100%;height:460px;overflow:auto;'><table id=\"sta_sta_bssid_mac\"><thead><tr><th>曾经的活动时间（非最后的活动时间）</th><th>无线热点设备</th></tr></thead></table></div>";
    generate_html += "      </div>";
    generate_html += "    </div>";
    generate_html += "  </div>";
    generate_html += "</div>";
    generate_html += "<div class=\"modal fade\" id=\"modal_sta_ssid_mac\" tabindex=\"9999\" role=\"dialog\" aria-labelledby=\"modal_sta_ssid_mac_label\" aria-hidden=\"true\">";
    generate_html += "  <div class=\"modal-dialog\">";
    generate_html += "    <div class=\"modal-content\">";
    generate_html += "      <div class=\"modal-header\">";
    generate_html += "        <button type=\"button\" class=\"close\" aria-hidden=\"true\" onclick=\"$('#modal_sta_ssid_mac').modal('hide');\">&times;</button>";
    generate_html += "        <h4 class=\"modal-title\" id=\"modal_sta_ssid_mac_label\">曾经连接过的SSID</h4>";
    generate_html += "      </div>";
    generate_html += "      <div class=\"modal-body\">";
    generate_html += "        <div style='width:100%;height:460px;overflow:auto;'><table id=\"sta_sta_ssid_mac\"><thead><tr><th>记录新增时间（非曾经连接时间）</th><th>SSID</th></tr></thead></table></div>";
    generate_html += "      </div>";
    generate_html += "    </div>";
    generate_html += "  </div>";
    generate_html += "</div>";
    generate_html += "<p class='offset_top'><h3>与无线热点的交流</h3></p>";
    generate_html += "<div style='width:100%;height:290px;overflow:auto;'><table id=\"sta_sta_action\"><thead><tr><th>时间</th><th>用户设备</th><th>无线热点设备</th><th>操作类型</th><th>距离（米）</th></tr></thead></table></div>";
    $('#modal_dosta .modal-body').html(generate_html);
    $('#modal_dosta').modal('show');
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
    $('#modal_dosta #sta_sta_action').bootstrapTable({
      dataType: "json",
      sidePagination: "server",
      ajax: function(params){
        $.post("/runnable/ajax.php", {action: 'sta_action_mac', mac: show_sta["mac"], offset: params.data.offset, size: params.data.limit, sort: params.data.sort, order: params.data.order}, function(result){
          var res = JSON.parse(result);
          for (var i in res['rows']){
            res['rows'][i].time = getLocalTime(res['rows'][i].time);
            res['rows'][i].mac = hexToMac(res['rows'][i].mac);
            res['rows'][i].bssid = hexToMac(res['rows'][i].bssid);
            var sta_subtype = res['rows'][i].subtype;
            if (sta_subtype == "0") res['rows'][i].subtype = "关联请求";
            if (sta_subtype == "1") res['rows'][i].subtype = "关联回应";
            if (sta_subtype == "2") res['rows'][i].subtype = "重关联请求";
            if (sta_subtype == "3") res['rows'][i].subtype = "重关联回应";
            if (sta_subtype == "4") res['rows'][i].subtype = "扫描请求";
            if (sta_subtype == "5") res['rows'][i].subtype = "扫描回应";
            if (sta_subtype == "8") res['rows'][i].subtype = "广播信标";
            if (sta_subtype == "10") res['rows'][i].subtype = "解除关联";
            if (sta_subtype == "11") res['rows'][i].subtype = "认证";
            if (sta_subtype == "12") res['rows'][i].subtype = "解除认证";
          }
          params.success(res);
        });
      },
      pagination: true,
      pageSize: 5,
      pageList: [5, 10, 25, 50],
      singleSelect: false,
      sortName: "time",
      sortOrder: "desc",
      columns: [{title: '时间',field: 'time',sortable: true}, {title: '用户设备', field: 'mac'}, {title: '无线热点设备', field: 'bssid'}, {title: '操作类型',field: 'subtype',sortable: true}, {title: '距离（米）',field: 'distance',sortable: true}]
    });
  }

  // 显示曾经连接过的无线热点设备对话框函数
  function sta_bssid_mac_show(mac){
    $.post("/runnable/ajax.php", {action: 'sta_bssid_mac', mac: mac}, function(result){
      var res = JSON.parse(result);
      for (var i in res){
        res[i].time = getLocalTime(res[i].time);
        res[i].bssid = hexToMac(res[i].bssid);
      }
      $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
      $('#modal_sta_bssid_mac #sta_sta_bssid_mac').bootstrapTable({
        data: res,
        dataType: "json",
        pagination: true,
        pageSize: 8,
        pageList: [8, 10, 25, 50, 100, 'All'],
        singleSelect: false,
        sortName: "time",
        sortOrder: "desc",
        columns: [{title: '记录新增时间（非曾经连接时间）',field: 'time',sortable: true}, {title: '无线热点设备',field: 'bssid'}]
      });
    });
    $('#modal_sta_bssid_mac').modal('show');
  }

  // 显示曾经连接过的SSID对话框函数
  function sta_ssid_mac_show(mac){
    $.post("/runnable/ajax.php", {action: 'sta_ssid_mac', mac: mac}, function(result){
      var res = JSON.parse(result);
      for (var i in res){
        res[i].time = getLocalTime(res[i].time);
      }
      $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
      $('#modal_sta_ssid_mac #sta_sta_ssid_mac').bootstrapTable({
        data: res,
        dataType: "json",
        pagination: true,
        pageSize: 8,
        pageList: [8, 10, 25, 50, 100, 'All'],
        singleSelect: false,
        sortName: "time",
        sortOrder: "desc",
        columns: [{title: '曾经的活动时间（非最后的活动时间）',field: 'time',sortable: true}, {title: 'SSID',field: 'ssid'}]
      });
    });
    $('#modal_sta_ssid_mac').modal('show');
  }


/**
  * 综合查询 */

  var search_isInit = 0;

  // 初始化所有查询
  function search_init(){
    if (search_isInit == 0){
      search_isInit = 1;
      search_init_device();
      search_init_ap();
      search_init_sta();
    }
  }

  // 初始化局端设备查询
  function search_init_device(){
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
    $('#search_device #search_table_device').bootstrapTable({
      dataType: "json",
      sidePagination: "server",
      ajax: function(params){
        $.post("/runnable/ajax.php", {action: 'search_device', offset: params.data.offset, size: params.data.limit, sort: params.data.sort, order: params.data.order, search: params.data.search}, function(result){
          var res = JSON.parse(result);
          for (var i in res['rows']){
            res['rows'][i].device = hexToMac(res['rows'][i].device);
            res['rows'][i].time = getLocalTime(res['rows'][i].time);
          }
          params.success(res);
        });
      },
      pagination: true,
      pageSize: 10,
      pageList: [10, 25, 50, 100],
      singleSelect: false,
      search: true,
      sortName: "time",
      sortOrder: "desc",
      columns: [{title: '设备地址',field: 'device',sortable: true}, {title: '名称',field: 'name',sortable: true}, {title: '经度',field: 'lng',sortable: true}, {title: '纬度',field: 'lat',sortable: true}, {title: '最后活动时间',field: 'time',sortable: true}]
    });
  }

  // 初始化无线热点设备查询
  function search_init_ap(){
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
    $('#search_ap #search_table_ap').bootstrapTable({
      dataType: "json",
      sidePagination: "server",
      ajax: function(params){
        $.post("/runnable/ajax.php", {action: 'search_ap', offset: params.data.offset, size: params.data.limit, sort: params.data.sort, order: params.data.order, search: params.data.search}, function(result){
          var res = JSON.parse(result);
          for (var i in res['rows']){
            if (res['rows'][i].state == "1"){
              res['rows'][i].state = "<span style='color:green;'>在线</span>";
            }else{
              res['rows'][i].state = "<span style='color:red;'>离线</span>";
            }
            res['rows'][i].device = hexToMac(res['rows'][i].device);
            if (res['rows'][i].ssid == "") res['rows'][i].ssid = "<i style='color:gray;'>(隐藏 )</i>";
            res['rows'][i].bssid = hexToMac(res['rows'][i].bssid);
            res['rows'][i].timeold = getLocalTime(res['rows'][i].timeold);
            res['rows'][i].time = getLocalTime(res['rows'][i].time);
            if (res['rows'][i].enc == "1"){
              res['rows'][i].enc = "是";
            }else{
              res['rows'][i].enc = "否";
            }
          }
          params.success(res);
        });
      },
      pagination: true,
      pageSize: 10,
      pageList: [10, 25, 50, 100],
      singleSelect: false,
      search: true,
      sortName: "time",
      sortOrder: "desc",
      columns: [{title: '状态',field: 'state',sortable: true}, {title: '局端地址',field: 'device',sortable: true}, {title: 'SSID',field: 'ssid',sortable: true}, {title: 'BSSID',field: 'bssid',sortable: true}, {title: '创建时间',field: 'timeold',sortable: true}, {title: '更新时间',field: 'time',sortable: true}, {title: '频道',field: 'ch',sortable: true}, {title: '是否加密',field: 'enc',sortable: true}, {title: '距离（米）',field: 'distance',sortable: true}]
    });
  }

  // 初始化用户设备查询
  function search_init_sta(){
    $.extend($.fn.bootstrapTable.defaults, $.fn.bootstrapTable.locales['zh-CN']);
    $('#search_sta #search_table_sta').bootstrapTable({
      dataType: "json",
      sidePagination: "server",
      ajax: function(params){
        $.post("/runnable/ajax.php", {action: 'search_sta', offset: params.data.offset, size: params.data.limit, sort: params.data.sort, order: params.data.order, search: params.data.search}, function(result){
          var res = JSON.parse(result);
          for (var i in res['rows']){
            res['rows'][i].device = hexToMac(res['rows'][i].device);
            res['rows'][i].time = getLocalTime(res['rows'][i].time);
            res['rows'][i].mac = hexToMac(res['rows'][i].mac);
            res['rows'][i].bssid = hexToMac(res['rows'][i].bssid);
            var sta_subtype = res['rows'][i].subtype;
            if (sta_subtype == "0") res['rows'][i].subtype = "关联请求";
            if (sta_subtype == "1") res['rows'][i].subtype = "关联回应";
            if (sta_subtype == "2") res['rows'][i].subtype = "重关联请求";
            if (sta_subtype == "3") res['rows'][i].subtype = "重关联回应";
            if (sta_subtype == "4") res['rows'][i].subtype = "扫描请求";
            if (sta_subtype == "5") res['rows'][i].subtype = "扫描回应";
            if (sta_subtype == "8") res['rows'][i].subtype = "广播信标";
            if (sta_subtype == "10") res['rows'][i].subtype = "解除关联";
            if (sta_subtype == "11") res['rows'][i].subtype = "认证";
            if (sta_subtype == "12") res['rows'][i].subtype = "解除认证";
          }
          params.success(res);
        });
      },
      pagination: true,
      pageSize: 10,
      pageList: [10, 25, 50, 100],
      singleSelect: false,
      search: true,
      sortName: "time",
      sortOrder: "desc",
      columns: [{title: '局端地址',field: 'device',sortable: true}, {title: '记录时间',field: 'time',sortable: true}, {title: '设备地址',field: 'mac',sortable: true}, {title: 'BSSID',field: 'bssid',sortable: true}, {title: '操作类型',field: 'subtype',sortable: true}, {title: '距离（米）',field: 'distance',sortable: true}]
    });
  }


/**
  * 数据统计对话框 */

  // 加载数据统计的数据
  function stats_load(){
    $('#stats_device').text('None');
    $('#stats_ap').text('None');
    $('#stats_sta').text('None');
    $.post("/runnable/ajax.php", {action: 'stats_device'}, function(result){
      var res = JSON.parse(result);
      $('#stats_device').text(res[0]);
    });
    $.post("/runnable/ajax.php", {action: 'stats_ap'}, function(result){
      var res = JSON.parse(result);
      $('#stats_ap').text(res[0]);
    });
    $.post("/runnable/ajax.php", {action: 'stats_sta'}, function(result){
      var res = JSON.parse(result);
      $('#stats_sta').text(res[0]);
    });
  }


/**
  * 坐标转换对话框 */

  // Vue实例化
  new Vue({
    el: '#modal_geo',
    data: {
      text1: "",
      geo_option1: "1",
      text2: "",
      text3: "",
      text4: ""
    },
    methods: {
      isGeoPoint: function(select) {
        var input_text = this.text1;
        input_text = input_text.replace(/ /g, ',');
        input_text = input_text.replace(new RegExp(',+', "gm"), ',');
        var input_text_split = input_text.split(',');
        if (input_text_split.length < 2) return;
        if (input_text_split[0].length <= 0 || input_text_split[1].length <= 0) return;
        var point = [input_text_split[0], input_text_split[1]];
        if (parseFloat(point[0]) < -180 || parseFloat(point[0]) > 180){
          point[0] = "";
        }
        if (parseFloat(point[1]) < -90 || parseFloat(point[1]) > 90){
          point[1] = "";
        }
        if (point[0] == "" || point[1] == ""){
          this.text2 = "转换失败";
          this.text3 = "转换失败";
          this.text4 = "转换失败";
          return;
        }
        var point_wgs84, point_gcj02, point_bd09;
        if (select > 0 ? select == 1 : this.geo_option1 == "1"){
          point_wgs84 = bd09towgs84(point);
          point_gcj02 = bd09togcj02(point);
          point_bd09 = point;
        }
        if (select > 0 ? select == 2 : this.geo_option1 == "2"){
          point_wgs84 = gcj02towgs84(point);
          point_gcj02 = point;
          point_bd09 = gcj02tobd09(point);
        }
        if (select > 0 ? select == 3 : this.geo_option1 == "3"){
          point_wgs84 = point;
          point_gcj02 = wgs84togcj02(point);
          point_bd09 = wgs84tobd09(point);
        }
        if (isNaN(point_wgs84[0]) || isNaN(point_wgs84[1])){
          this.text2 = "转换失败";
        }else{
          this.text2 = point_wgs84[0].toString().substring(0,19) + ", " + point_wgs84[1].toString().substring(0,18);
        }
        if (isNaN(point_gcj02[0]) || isNaN(point_gcj02[1])){
          this.text3 = "转换失败";
        }else{
          this.text3 = point_gcj02[0].toString().substring(0,19) + ", " + point_gcj02[1].toString().substring(0,18);
        }
        if (isNaN(point_bd09[0]) || isNaN(point_bd09[1])){
          this.text4 = "转换失败";
        }else{
          this.text4 = point_bd09[0].toString().substring(0,19) + ", " + point_bd09[1].toString().substring(0,18);
        }
      },
      reset: function() {
        this.text1 = "cleanning...";
        this.text1 = "";
      }
    }
  });


/**
  * 个性化设置对话框 */

  // 初始化配置函数
  function settings_init(){
    var cookie_color = $.cookie('color');
    var cookie_autogeo = $.cookie('autogeo');
    var cookie_drawing = $.cookie('drawing');
    var cookie_overview = $.cookie('overview');
    var cookie_scale = $.cookie('scale');
    var cookie_geo = $.cookie('geo');
    var option1 = $("#modal_settings input[name='settings_option1']");
    var option2 = $("#modal_settings input[name='settings_option2']");
    var option3 = $("#modal_settings input[name='settings_option3']");
    var option4 = $("#modal_settings input[name='settings_option4']");
    var option5 = $("#modal_settings input[name='settings_option5']");
    var option6 = $("#modal_settings input[name='settings_option6']");
    option1.removeAttr('checked');
    option2.removeAttr('checked');
    option3.removeAttr('checked');
    option4.removeAttr('checked');
    option5.removeAttr('checked');
    option6.removeAttr('checked');
    if (!cookie_color){
      option1[0].checked = true;
    }else{
      option1[parseInt(cookie_color)-1].checked = true;
    }
    if (cookie_autogeo != 0){
      option2[0].checked = true;
    }else{
      option2[1].checked = true;
    }
    if (cookie_drawing == 0){
      option3[1].checked = true;
    }else{
      option3[0].checked = true;
    }
    if (cookie_overview == 0){
      option4[1].checked = true;
    }else{
      option4[0].checked = true;
    }
    if (cookie_scale == 0){
      option5[1].checked = true;
    }else{
      option5[0].checked = true;
    }
    if (cookie_geo == 0){
      option6[1].checked = true;
    }else{
      option6[0].checked = true;
    }
  }

  // 保存配置函数
  function settings_true(){
    var option1_val = $("#modal_settings input[name='settings_option1']:checked").val();
    var option2_val = $("#modal_settings input[name='settings_option2']:checked").val();
    var option3_val = $("#modal_settings input[name='settings_option3']:checked").val();
    var option4_val = $("#modal_settings input[name='settings_option4']:checked").val();
    var option5_val = $("#modal_settings input[name='settings_option5']:checked").val();
    var option6_val = $("#modal_settings input[name='settings_option6']:checked").val();
    $.cookie('color', option1_val);
    if (option2_val == "1") $.cookie('autogeo', "1");
    if (option2_val == "2") $.cookie('autogeo', "0");
    if (option3_val == "1") $.cookie('drawing', "1");
    if (option3_val == "2") $.cookie('drawing', "0");
    if (option4_val == "1") $.cookie('overview', "1");
    if (option4_val == "2") $.cookie('overview', "0");
    if (option5_val == "1") $.cookie('scale', "1");
    if (option5_val == "2") $.cookie('scale', "0");
    if (option6_val == "1") $.cookie('geo', "1");
    if (option6_val == "2") $.cookie('geo', "0");
  }

  // 放弃配置函数
  function settings_false(){
    var cookie_color = $.cookie('color');
    var cookie_drawing = $.cookie('drawing');
    var cookie_overview = $.cookie('overview');
    var cookie_scale = $.cookie('scale');
    var cookie_geo = $.cookie('geo');
    if (!cookie_color){
      $('body').removeClass(function (index, css) {
        return (css.match (/\btheme-\S+/g) || []).join(' ');
      })
      $('body').addClass('theme-blue');
    }else{
      $('body').removeClass(function (index, css) {
        return (css.match (/\btheme-\S+/g) || []).join(' ');
      })
      $('body').addClass('theme-' + cookie_color);
    }
    if (cookie_drawing == 0){
      $('.BMapLib_Drawing').hide();
    }else{
      $('.BMapLib_Drawing').show();
    }
    if (cookie_overview == 0){
      bdmap_control_overview.hide();
    }else{
      bdmap_control_overview.show();
    }
    if (cookie_scale == 0){
      bdmap_control_scale.hide();
    }else{
      bdmap_control_scale.show();
    }
    if (cookie_geo == 0){
      bdmap_control_geo.hide();
      $('.BMap_geolocationContainer').parent().hide();
    }else{
      bdmap_control_geo.show();
      $('.BMap_geolocationContainer').parent().show();
    }
  }

  // 临时生效函数
  function settings_set(name, value){
    if (name == "settings_option1"){
      $('body').removeClass(function (index, css) {
        return (css.match (/\btheme-\S+/g) || []).join(' ');
      })
      $('body').addClass('theme-' + value);
      return;
    }
    if (name == "settings_option3"){
      if (value == "1") $('.BMapLib_Drawing').show();
      if (value == "2") $('.BMapLib_Drawing').hide();
      return;
    }
    if (name == "settings_option4"){
      if (value == "1") bdmap_control_overview.show();
      if (value == "2") bdmap_control_overview.hide();
      return;
    }
    if (name == "settings_option5"){
      if (value == "1") bdmap_control_scale.show();
      if (value == "2") bdmap_control_scale.hide();
    }
    if (name == "settings_option6"){
      if (value == "1"){
        bdmap_control_geo.show();
        $('.BMap_geolocationContainer').parent().show();
      }
      if (value == "2"){
        bdmap_control_geo.hide();
        $('.BMap_geolocationContainer').parent().hide();
      }
    }
  }


// 百度经纬度坐标转换国测局坐标/火星坐标
function bd09togcj02(point){
  return coordtransform.bd09togcj02(point[0], point[1]);
}

// 国测局坐标/火星坐标转换百度经纬度坐标
function gcj02tobd09(point){
  return coordtransform.gcj02tobd09(point[0], point[1]);
}

// 地球坐标转换国测局坐标/火星坐标
function wgs84togcj02(point){
  return coordtransform.wgs84togcj02(point[0], point[1]);
}

// 国测局坐标/火星坐标转换地球坐标
function gcj02towgs84(point){
  return coordtransform.gcj02towgs84(point[0], point[1]);
}

// 百度经纬度坐标转换地球坐标
function bd09towgs84(point){
  var point_gcj02 = coordtransform.bd09togcj02(point[0], point[1]);
  return coordtransform.gcj02towgs84(point_gcj02[0], point_gcj02[1]);
}

// 地球坐标转换百度经纬度坐标
function wgs84tobd09(point){
  var point_gcj02 = coordtransform.wgs84togcj02(point[0], point[1]);
  return coordtransform.gcj02tobd09(point_gcj02[0], point_gcj02[1]);
}

// 根据距离获取地图放大倍数
function zoomScale(zoom){
  if (zoom <= 20) return 19;
  if (zoom <= 50) return 18;
  if (zoom <= 100) return 17;
  if (zoom <= 200) return 16;
  if (zoom <= 500) return 15;
  if (zoom <= 1000) return 14;
  if (zoom <= 2000) return 13;
  if (zoom <= 5000) return 12;
  if (zoom <= 10000) return 11;
  if (zoom <= 20000) return 10;
  if (zoom <= 25000) return 9;
  if (zoom <= 50000) return 8;
  if (zoom <= 100000) return 7;
  if (zoom <= 200000) return 6;
  if (zoom <= 500000) return 5;
  if (zoom <= 1000000) return 4;
  if (zoom <= 2000000) return 3;
  if (zoom <= 5000000) return 2;
  return 1;
}

// 时间戳是否活动
function isTimeAlive(time){
  var now_time = Date.parse(new Date()).toString();
  now_time = parseInt(now_time.substring(0,now_time.length-3));
  var time_offset = now_time - parseInt(time);
  if (time_offset <= 300) return true;
  return false;
}

// 时间戳格式化为字符串相对时间
function getRelativeTime(time){
  var now_time = Date.parse(new Date()).toString();
  now_time = parseInt(now_time.substring(0, now_time.length-3));
  var time_offset = now_time - parseInt(time);
  var time_format = new Array();
  time_format.push({0: "31536000", 1: "年"});
  time_format.push({0: "2592000", 1: "个月"});
  time_format.push({0: "604800", 1: "星期"});
  time_format.push({0: "86400", 1: "天"});
  time_format.push({0: "3600", 1: "小时"});
  time_format.push({0: "60", 1: "分钟"});
  time_format.push({0: "1", 1: "秒"});
  if (time_offset <= 0) return "刚刚";
  var ret_str = 0;
  for (var i in time_format){
    ret_str = Math.floor(time_offset / parseInt(time_format[i][0]));
    if (ret_str != 0) {
      return ret_str + time_format[i][1] + "前";
    }
  }
  return "未知";
}

// 时间戳格式化为字符串时间
function getLocalTime(nS) {
  return new Date(parseInt(nS) * 1000).toLocaleString();
}

// 字符串时间格式化为时间戳
function getTimeStamp(tS) {
  var time = new Date(tS.substring(0, 19).replace(/-/g, '/')).getTime().toString();
  return time.substring(0, time.length - 3);
}

// 16进制转MAC
function hexToMac(hex){
  var mac = "";
  for (i=0;i<Math.ceil(hex.length/2);i++){
    if (i!=0) mac += ":";
    mac += hex[i*2];
    if (hex.length>=(i*2+2)) mac += hex[i*2+1];
  }
  return mac.toUpperCase();
}

// 字符串转MAC
function strToMac(str){
  var mac = new Array();
  var strs = str.split(";");
  for (i=0;i<strs.length;i++){
  	strs[i] = strs[i].replace(/-/g, '').replace(/:/g, '');
    if (/^[a-zA-Z\d]+$/.test(strs[i])) mac.push(strs[i].toUpperCase());
  }
  return mac;
}
