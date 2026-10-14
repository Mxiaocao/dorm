// 寝室卫生安排 - 后端服务（零依赖，只需 Node.js）
// 运行：PORT=8080 PASSCODE=你的口令 node server.js
var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = process.env.PORT || 8080;
// 口令只从环境变量读，不设默认值 —— 没配就拒绝启动，避免带着弱口令上线
var PASSCODE = process.env.PASSCODE || '';
// 数据目录：本地默认项目根目录，容器部署时用 DATA_DIR 指向挂载的 Volume
var DATA_DIR = process.env.DATA_DIR || __dirname;
var DATA_FILE = path.join(DATA_DIR, 'data.json');
var HTML_FILE = path.join(__dirname, 'index.html');

if (!PASSCODE) {
  console.error('未设置 PASSCODE 环境变量，拒绝启动。');
  console.error('本地运行示例：PASSCODE=你的口令 node server.js');
  process.exit(1);
}

// ---------- 数据读写（原子写 + 单进程串行，避免并发覆盖） ----------
var queue = Promise.resolve();

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    return { members: [], tasks: [], rotates: [], done: {} };
  }
}

function writeDb(db) {
  var tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

// 所有修改串行执行，读改写不丢数据。
// 关键：单个操作失败不能污染队列后续请求，所以失败结果也要吞掉错误再回传。
function mutate(fn) {
  var run = queue.then(function () {
    var db = readDb();
    var result;
    try {
      result = fn(db);
    } catch (e) {
      return { __err: e.message };
    }
    writeDb(db);
    return { __val: result };
  });
  queue = run.then(function () {}, function () {});
  return run.then(function (r) {
    if (r && r.__err) throw new Error(r.__err);
    return r ? r.__val : undefined;
  });
}

// ---------- HTTP 辅助 ----------
function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function readBody(req) {
  return new Promise(function (resolve) {
    var buf = '';
    req.on('data', function (c) { buf += c; if (buf.length > 1e6) req.destroy(); });
    req.on('end', function () {
      try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { resolve({}); }
    });
  });
}

function authorized(req) {
  return req.headers['x-passcode'] === PASSCODE;
}

// ---------- 接口 ----------
var api = {

  // GET /api/state
  'GET /api/state': function (req, res) {
    send(res, 200, readDb());
  },

  // POST /api/member
  'POST /api/member': function (req, res, body) {
    var name = String(body.name || '').trim();
    if (!name) return send(res, 400, { error: '姓名不能为空' });
    mutate(function (db) {
      if (db.members.some(function (m) { return m.name === name; })) {
        throw new Error('成员「' + name + '」已存在');
      }
      var m = { id: Date.now() + Math.floor(Math.random() * 1000), name: name };
      db.members.push(m);
      return m;
    }).then(function (m) { send(res, 200, m); })
      .catch(function (e) { send(res, 400, { error: e.message }); });
  },

  // POST /api/member/delete
  'POST /api/member/delete': function (req, res, body) {
    var id = Number(body.id);
    mutate(function (db) {
      db.members = db.members.filter(function (m) { return m.id !== id; });
    }).then(function () { send(res, 200, { ok: true }); })
      .catch(function (e) { send(res, 500, { error: e.message }); });
  },

  // POST /api/task
  'POST /api/task': function (req, res, body) {
    var name = String(body.name || '').trim();
    var date = String(body.date || '');
    if (!name || !date) return send(res, 400, { error: '任务名和日期不能为空' });
    mutate(function (db) {
      var t = { id: Date.now() + Math.floor(Math.random() * 1000), name: name, date: date, owner: Number(body.owner) || 0 };
      db.tasks.push(t);
      return t;
    }).then(function (t) { send(res, 200, t); })
      .catch(function (e) { send(res, 500, { error: e.message }); });
  },

  // POST /api/task/delete
  'POST /api/task/delete': function (req, res, body) {
    var id = Number(body.id);
    mutate(function (db) {
      db.tasks = db.tasks.filter(function (t) { return t.id !== id; });
      delete db.done[id];
    }).then(function () { send(res, 200, { ok: true }); })
      .catch(function (e) { send(res, 500, { error: e.message }); });
  },

  // POST /api/done  {taskId, date}  date 为空表示撤销
  'POST /api/done': function (req, res, body) {
    var id = String(body.taskId || '');
    var date = body.date ? String(body.date) : null;
    if (!id) return send(res, 400, { error: '缺少任务 id' });
    mutate(function (db) {
      if (date) db.done[id] = date;
      else delete db.done[id];
    }).then(function () { send(res, 200, { ok: true }); })
      .catch(function (e) { send(res, 500, { error: e.message }); });
  },

  // POST /api/rotate
  'POST /api/rotate': function (req, res, body) {
    var taskId = Number(body.taskId);
    var start = String(body.start || '');
    if (!taskId || !start) return send(res, 400, { error: '请选择任务和开始日期' });
    mutate(function (db) {
      if (!db.tasks.some(function (t) { return t.id === taskId; })) throw new Error('任务不存在');
      var r = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        taskId: taskId,
        start: start,
        skipWeekend: !!body.skipWeekend
      };
      db.rotates.push(r);
      return r;
    }).then(function (r) { send(res, 200, r); })
      .catch(function (e) { send(res, 400, { error: e.message }); });
  },

  // POST /api/rotate/generate {rotateId}  把排班写成真实任务
  'POST /api/rotate/generate': function (req, res, body) {
    var rid = Number(body.rotateId);
    mutate(function (db) {
      var r = db.rotates.filter(function (x) { return x.id === rid; })[0];
      if (!r) throw new Error('排班规则不存在');
      var src = db.tasks.filter(function (x) { return x.id === r.taskId; })[0];
      if (!src) throw new Error('源任务已被删除');
      if (!db.members.length) throw new Error('请先添加成员');

      var out = [], n = 0;
      for (var i = 0; i < 120 && n < 60; i++) {
        var d = new Date(r.start + 'T00:00:00');
        d.setDate(d.getDate() + i);
        var s = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        var wd = d.getDay();
        if (r.skipWeekend && (wd === 0 || wd === 6)) continue;
        var mm = db.members[(n + db.rotates.indexOf(r)) % db.members.length];
        out.push({ id: Date.now() + n * 7 + Math.floor(Math.random() * 6), name: src.name, date: s, owner: mm.id });
        n++;
      }
      var have = {};
      db.tasks.forEach(function (t) { have[t.name + '|' + t.date] = 1; });
      var made = out.filter(function (t) { return !have[t.name + '|' + t.date]; });
      db.tasks = db.tasks.concat(made);
      return made.length;
    }).then(function (n) { send(res, 200, { created: n }); })
      .catch(function (e) { send(res, 400, { error: e.message }); });
  },

  // POST /api/rotate/delete
  'POST /api/rotate/delete': function (req, res, body) {
    var id = Number(body.id);
    mutate(function (db) {
      db.rotates = db.rotates.filter(function (r) { return r.id !== id; });
    }).then(function () { send(res, 200, { ok: true }); })
      .catch(function (e) { send(res, 500, { error: e.message }); });
  },

  // POST /api/reset
  'POST /api/reset': function (req, res) {
    mutate(function (db) {
      db.members = []; db.tasks = []; db.rotates = []; db.done = {};
    }).then(function () { send(res, 200, { ok: true }); })
      .catch(function (e) { send(res, 500, { error: e.message }); });
  }
};

// ---------- 路由 ----------
var server = http.createServer(function (req, res) {
  var url = req.url.split('?')[0];

  // 登录校验接口
  if (req.method === 'POST' && url === '/api/login') {
    return readBody(req).then(function (b) {
      if (String(b.passcode || '') === PASSCODE) send(res, 200, { ok: true });
      else send(res, 401, { error: '口令不正确' });
    });
  }

  if (url.indexOf('/api/') === 0) {
    if (!authorized(req)) return send(res, 401, { error: '未授权，请先输入口令' });
    var handler = api[req.method + ' ' + url];
    if (!handler) return send(res, 404, { error: '接口不存在' });
    return readBody(req).then(function (b) { handler(req, res, b); });
  }

  // 静态页面
  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    fs.readFile(HTML_FILE, function (err, buf) {
      if (err) return send(res, 500, 'index.html 读取失败', 'text/plain; charset=utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
    return;
  }

  send(res, 404, { error: 'Not Found' });
});

server.listen(PORT, '0.0.0.0', function () {
  // 首次启动时确保数据目录存在，否则写文件会失败
  try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
  console.log('寝室卫生服务已启动: http://0.0.0.0:' + PORT);
  console.log('数据目录: ' + DATA_DIR);
});
