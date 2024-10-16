# Cloudflare-Worker-API-introduce

该项目基于 Cloudflare Workers 和 KV 存储，提供一个简单的 API 管理系统。它允许用户安全地存储、编辑和列举 API 数据，用户的凭据被单独存储以确保数据安全。

# 注意:我只实现了最基本的代码,并没有美化html,如需更美观的界面,请自行编辑或等待更新

## 功能

- **登录**：安全地存储用户凭据到单独的 KV 存储中。
- **编辑 API**：添加或编辑 API 详情。
- **列举 API**：获取已存储的 API 列表。

## 前置条件

- Cloudflare 账户
- Cloudflare Workers
- Cloudflare KV 存储

## 设置步骤

### 1. 新建Cloudflare Worker

将本仓库的index.js的代码复制到Cloudflare Worker中

### 2. 新建KV

一共需要两个KV:SESSIONS_KV和API_KV,并将账号密码写进SESSIONS_KV,格式为密钥:user:admin,值:{ "username": "你的账号", "password": "你的密码" }

注意:请替换掉"你的账号"和"你的密码"


### 3. 绑定KV

将KV绑定到Worker,变量名称即为KV名

### 4. 自定义域(可选)

自行绑定,不多作介绍

### 5. 访问页面

以api.hauchet.cn为例

主页面:api.hauchet.cn

登陆页面api.hauchet.cn/login

编辑页面api.hauchet.cn/edit
