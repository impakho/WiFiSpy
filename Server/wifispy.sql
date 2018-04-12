/*
Navicat MySQL Data Transfer

Source Server         : 127.0.0.1
Source Server Version : 50540
Source Host           : 127.0.0.1:3306
Source Database       : wifispy

Target Server Type    : MYSQL
Target Server Version : 50540
File Encoding         : 65001

Date: 2017-04-28 13:05:15
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for ap_id
-- ----------------------------
DROP TABLE IF EXISTS `ap_id`;
CREATE TABLE `ap_id` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `device` char(12) NOT NULL,
  `time` int(11) NOT NULL,
  `id` char(16) NOT NULL,
  `bssid` char(12) NOT NULL,
  `ssid` char(64) NOT NULL,
  PRIMARY KEY (`pid`),
  UNIQUE KEY `id` (`id`) USING BTREE,
  KEY `device` (`device`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `bssid` (`bssid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for ap_info
-- ----------------------------
DROP TABLE IF EXISTS `ap_info`;
CREATE TABLE `ap_info` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `id` char(16) NOT NULL,
  `time` int(11) NOT NULL,
  `ch` int(1) NOT NULL,
  `enc` int(1) NOT NULL,
  `state` int(1) NOT NULL,
  `rssi` int(1) NOT NULL,
  PRIMARY KEY (`pid`),
  UNIQUE KEY `id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for ap_log
-- ----------------------------
DROP TABLE IF EXISTS `ap_log`;
CREATE TABLE `ap_log` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `id` char(16) NOT NULL,
  `time` int(11) NOT NULL,
  `active` int(1) NOT NULL,
  PRIMARY KEY (`pid`),
  KEY `id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for ap_ssid
-- ----------------------------
DROP TABLE IF EXISTS `ap_ssid`;
CREATE TABLE `ap_ssid` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `id` char(16) NOT NULL,
  `ssid` varchar(64) NOT NULL,
  `hash` char(16) NOT NULL,
  PRIMARY KEY (`pid`),
  UNIQUE KEY `id` (`id`) USING BTREE,
  KEY `hash` (`hash`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for device_info
-- ----------------------------
DROP TABLE IF EXISTS `device_info`;
CREATE TABLE `device_info` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `device` char(12) NOT NULL,
  `name` varchar(32) NOT NULL,
  `lng` decimal(13,10) NOT NULL,
  `lat` decimal(13,10) NOT NULL,
  `time` int(11) NOT NULL,
  PRIMARY KEY (`pid`),
  UNIQUE KEY `device` (`device`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for sta_action
-- ----------------------------
DROP TABLE IF EXISTS `sta_action`;
CREATE TABLE `sta_action` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `device` char(12) NOT NULL,
  `time` int(11) NOT NULL,
  `mac` char(12) NOT NULL,
  `bssid` char(12) NOT NULL,
  `subtype` int(1) NOT NULL,
  `rssi` int(1) NOT NULL,
  PRIMARY KEY (`pid`),
  KEY `device` (`device`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `mac` (`mac`) USING BTREE,
  KEY `bssid` (`bssid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for sta_ssid
-- ----------------------------
DROP TABLE IF EXISTS `sta_ssid`;
CREATE TABLE `sta_ssid` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `time` int(11) NOT NULL,
  `mac` char(12) NOT NULL,
  `ssid` varchar(64) NOT NULL,
  `hash` char(16) NOT NULL,
  PRIMARY KEY (`pid`),
  UNIQUE KEY `hash` (`hash`) USING BTREE,
  KEY `time` (`time`) USING BTREE,
  KEY `mac` (`mac`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
