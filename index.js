addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === '/') {
      return new Response(indexHtml, { headers: { 'Content-Type': 'text/html' } })
  } else if (path === '/login') {
      return new Response(loginHtml, { headers: { 'Content-Type': 'text/html' } })
  } else if (path === '/edit') {
      return new Response(editHtml, { headers: { 'Content-Type': 'text/html' } })
  } else if (path === '/api/list') {
      const apiList = await API_KV.list()
      const apiData = await Promise.all(apiList.keys.map(key => API_KV.get(key.name, 'json')))
      return new Response(JSON.stringify(apiData), { headers: { 'Content-Type': 'application/json' } })
  } else if (path === '/api/login' && request.method === 'POST') {
      const formData = await request.formData()
      const username = formData.get('username')
      const password = formData.get('password')
      const isValid = await validateUser(username, password)
      if (isValid) {
          const sessionId = generateSessionId()
          await SESSIONS_KV.put(sessionId, username)
          return new Response(null, {
              status: 302,
              headers: {
                  'Set-Cookie': `session=${sessionId}; HttpOnly; Secure; Path=/`,
                  'Location': '/edit'
              }
          })
      } else {
          return new Response('账号或密码错误', { status: 401 })
      }
  } else if (path === '/api/edit' && request.method === 'POST') {
      const cookies = request.headers.get('Cookie')
      const sessionId = getSessionIdFromCookie(cookies)
      const username = await SESSIONS_KV.get(sessionId)
      if (username) {
          const formData = await request.formData()
          const name = formData.get('name')
          const url = formData.get('url')
          const description = formData.get('description')
          await API_KV.put(name, JSON.stringify({ name, url, description }))
          return new Response(null, {
              status: 302,
              headers: {
                  'Location': '/edit'
              }
          })
      } else {
          return new Response('未授权', { status: 401 })
      }
  } else {
      return new Response('页面未找到', { status: 404 })
  }
}

async function validateUser(username, password) {
  const user = await SESSIONS_KV.get(`user:admin`, 'json')
  return user && user.username === username && user.password === password
}

function generateSessionId() {
  return crypto.randomUUID()
}

function getSessionIdFromCookie(cookies) {
  const matches = cookies.match(/session=([^;]+)/)
  return matches ? matches[1] : null
}

const indexHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API 总览</title>
  <style>
      body {
          font-family: Arial, sans-serif;
          background-color: #f8f9fa;
          margin: 0;
          padding: 20px;
      }
      h1 {
          text-align: center;
          color: #343a40;
      }
      .api-list {
          list-style: none;
          padding: 0;
      }
      .api-item {
          margin: 10px 0;
          padding: 20px;
          border: 1px solid #ced4da;
          border-radius: 5px;
          background-color: #ffffff;
      }
      .api-item h2 {
          margin: 0;
          color: #495057;
      }
      .api-item p {
          margin: 10px 0;
          color: #6c757d;
      }
      .api-item a {
          color: #007bff;
          text-decoration: none;
      }
      .api-item a:hover {
          text-decoration: underline;
      }
  </style>
</head>
<body>
  <h1>API 总览</h1>
  <ul class="api-list" id="api-list"></ul>
  <script>
      fetch('/api/list')
          .then(response => response.json())
          .then(data => {
              const apiList = document.getElementById('api-list');
              data.forEach(api => {
                  const li = document.createElement('li');
                  li.className = 'api-item';
                  li.innerHTML = \`<h2>\${api.name}</h2><p>\${api.description}</p><a href="\${api.url}">\${api.url}</a>\`;
                  apiList.appendChild(li);
              });
          });
  </script>
</body>
</html>
`

const loginHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>登录</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
            margin: 0;
        }
        .login-form {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
            width: 400px;
        }
        .login-form input {
            display: block;
            width: 100%;
            margin-bottom: 20px;
            padding: 15px;
            font-size: 16px;
            border: 1px solid #ced4da;
            border-radius: 5px;
        }
        .login-form button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 5px;
            background-color: #007bff;
            color: white;
            font-size: 18px;
            cursor: pointer;
        }
        .login-form button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <form class="login-form" action="/api/login" method="POST">
        <input type="text" name="username" placeholder="用户名" required>
        <input type="password" name="password" placeholder="密码" required>
        <button type="submit">登录</button>
    </form>
</body>
</html>
`

const editHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>编辑 API</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
            margin: 0;
        }
        .edit-form {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
            width: 600px;
        }
        .edit-form input, .edit-form textarea {
            display: block;
            width: 100%;
            margin-bottom: 20px;
            padding: 15px;
            font-size: 16px;
            border: 1px solid #ced4da;
            border-radius: 5px;
        }
        .edit-form button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 5px;
            background-color: #007bff;
            color: white;
            font-size: 18px;
            cursor: pointer;
        }
        .edit-form button:hover {
            background-color: #0056b3;
        }
    </style>
</head>
<body>
    <form class="edit-form" action="/api/edit" method="POST">
        <input type="text" name="name" placeholder="API 名称" required>
        <input type="url" name="url" placeholder="API 地址" required>
        <textarea name="description" placeholder="API 描述" required></textarea>
        <button type="submit">保存</button>
    </form>
</body>
</html>
`
