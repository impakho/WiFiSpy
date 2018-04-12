// 调整导航条、地图容器和综合查询高度，以适配浏览器高度
$('#sidebar-nav').height(document.body.clientHeight-52);
$('#map-container').height(document.body.clientHeight-52);
$('#search-container').height(document.body.clientHeight-90);

// 百度地图加载瓦片数据回调函数（待用）
var $collector$ = {
  appendTile: function (path, url) {
    addUrls(path, url);
  }
};
function addUrls(path, url) {
  /*var div = document.getElementById("list");
  var anchor = document.createElement("a");
  anchor.href = url;
  anchor.innerHTML = path;
  div.appendChild(anchor);
  var br = document.createElement("br");
  div.appendChild(br);

  $.ajax({
    url: '/saveTile',
    type: 'get',
    dataType: 'json',
    data: {
      path: path,
      url: url
    },
    success: function (result) {
      console.log(3)
    }
  })*/
}

// 初始化百度地图
var map = new BMap.Map("map-container", {mapType: BMAP_NORMAL_MAP});      // 设置普通地图
var point = new BMap.Point(106, 36);         // 创建点坐标
map.centerAndZoom(point, 5);                     // 初始化地图,设置中心点坐标和地图级别。

// 瓦片数据加载完成，显示左下角定位图标
map.addEventListener("tilesloaded", onMapTilesLoad);
function onMapTilesLoad(){
  var cookie_geo = $.cookie('geo');
  if (cookie_geo != 0){
    $('.BMap_geolocationContainer').parent().show();
  }
}

// 地图点击事件（用于显示覆盖物操作对话框）
var mapClick_overlay;
map.addEventListener("click", onMapClick);
function onMapClick(e){
  mapClick_overlay = e.overlay;
  if (e.overlay != null){
    if (isDeviceOverlay(e.overlay)) dodevice_show();
    if (isAPOverlay(e.overlay)) doap_show();
    if (isStaOverlay(e.overlay)) dosta_show();
  }
}

// 地图右击事件（用于显示覆盖物右键菜单）
var mapRightClick_overlay;
map.addEventListener("rightclick", onMapRightClick);
function onMapRightClick(e){
  mapRightClick_overlay = e.overlay;
  if (e.overlay == null){
    $('#map-container').addClass("disabled");
  }else{
    $('#map-container').removeClass("disabled");
  }
}

// 添加地图控制器
map.addControl(new BMap.MapTypeControl({anchor: BMAP_ANCHOR_TOP_RIGHT}));
map.addControl(new BMap.NavigationControl());
var bdmap_control_overview = new BMap.OverviewMapControl({isOpen: true});
var bdmap_control_scale = new BMap.ScaleControl({anchor: BMAP_ANCHOR_TOP_LEFT});
var bdmap_control_geo = new BMap.GeolocationControl({offset: new BMap.Size(10, 10)});
map.addControl(bdmap_control_overview);
map.addControl(bdmap_control_scale);
map.addControl(bdmap_control_geo);

var cookie_overview = $.cookie('overview');
if (cookie_overview == 0){
  bdmap_control_overview.hide();
}
var cookie_scale = $.cookie('scale');
if (cookie_scale == 0){
  bdmap_control_scale.hide();
}
var cookie_geo = $.cookie('geo');
if (cookie_geo == 0){
  bdmap_control_geo.hide();
}


map.enableScrollWheelZoom();                  // 启用滚轮放大缩小。
map.enableKeyboard();                         // 启用键盘操作。

var cookie_autogeo = $.cookie('autogeo');
if (cookie_autogeo != 0){
  var geolocation = new BMap.Geolocation();
  geolocation.getCurrentPosition(function(r){
    if (this.getStatus() == BMAP_STATUS_SUCCESS){ 
      map.centerAndZoom(r.point, 12);
    } 
  },{enableHighAccuracy: false})
}

// 蓝色样式
var styleOptionsBlue = {
  strokeColor:"blue",     // 边线颜色。
  fillColor:"white",      // 填充颜色。当参数为空时，圆形将没有填充效果。
  strokeWeight: 3,        // 边线的宽度，以像素为单位。
  strokeOpacity: 0.6,     // 边线透明度，取值范围0 - 1。
  fillOpacity: 0.3,       // 填充的透明度，取值范围0 - 1。
  strokeStyle: 'solid'    // 边线的样式，solid或dashed。
}

// 红色样式
var styleOptionsRed = {
  strokeColor:"red",      //边线颜色。
  fillColor:"",           //填充颜色。当参数为空时，圆形将没有填充效果。
  strokeWeight: 3,        //边线的宽度，以像素为单位。
  strokeOpacity: 0.8,     //边线透明度，取值范围0 - 1。
  fillOpacity: 1.0,       //填充的透明度，取值范围0 - 1。
  strokeStyle: 'solid'    //边线的样式，solid或dashed。
}

// 绿色样式
var styleOptionsGreen = {
  strokeColor:"green",      //边线颜色。
  fillColor:"",           //填充颜色。当参数为空时，圆形将没有填充效果。
  strokeWeight: 3,        //边线的宽度，以像素为单位。
  strokeOpacity: 0.8,     //边线透明度，取值范围0 - 1。
  fillOpacity: 1.0,       //填充的透明度，取值范围0 - 1。
  strokeStyle: 'solid'    //边线的样式，solid或dashed。
}

// 橙色样式
var styleOptionsOrange = {
  strokeColor:"orange",      //边线颜色。
  fillColor:"",           //填充颜色。当参数为空时，圆形将没有填充效果。
  strokeWeight: 3,        //边线的宽度，以像素为单位。
  strokeOpacity: 0.8,     //边线透明度，取值范围0 - 1。
  fillOpacity: 1.0,       //填充的透明度，取值范围0 - 1。
  strokeStyle: 'solid'    //边线的样式，solid或dashed。
}

// 黑色样式
var styleOptionsBlack = {
  strokeColor:"black",      //边线颜色。
  fillColor:"",           //填充颜色。当参数为空时，圆形将没有填充效果。
  strokeWeight: 3,        //边线的宽度，以像素为单位。
  strokeOpacity: 0.8,     //边线透明度，取值范围0 - 1。
  fillOpacity: 1.0,       //填充的透明度，取值范围0 - 1。
  strokeStyle: 'solid'    //边线的样式，solid或dashed。
}

// 灰色样式
var styleOptionsGray = {
  strokeColor:"gray",      //边线颜色。
  fillColor:"",           //填充颜色。当参数为空时，圆形将没有填充效果。
  strokeWeight: 2,        //边线的宽度，以像素为单位。
  strokeOpacity: 0.3,     //边线透明度，取值范围0 - 1。
  fillOpacity: 1.0,       //填充的透明度，取值范围0 - 1。
  strokeStyle: 'solid'    //边线的样式，solid或dashed。
}

// 实例化鼠标绘制工具
var drawingManager = new BMapLib.DrawingManager(map, {
  isOpen: true,                  // 是否开启绘制模式
  enableDrawingTool: true,       // 是否显示工具栏
  enableCalculate: false,
  drawingToolOptions: {
    anchor: BMAP_ANCHOR_TOP_RIGHT,      // 位置
    offset: new BMap.Size($('#map-container').width()/2-160, 5),       // 偏离值
    scale: 0.8,
  },
  circleOptions: styleOptionsRed,       // 圆的样式
  polylineOptions: styleOptionsRed,     // 线的样式
  polygonOptions: styleOptionsRed,      // 多边形的样式
  rectangleOptions: styleOptionsRed     // 矩形的样式
});
drawingManager.close();

var cookie_drawing = $.cookie('drawing');
if (cookie_drawing == 0){
  $('.BMapLib_Drawing').hide();
}
