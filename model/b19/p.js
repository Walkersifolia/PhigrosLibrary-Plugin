
const http = require("http");
const httpProxy = require("http-proxy");

const url = require("url");
const fs = require("fs");
const path = require("path");

var proxy = httpProxy.createProxyServer();

process.on("uncaughtException", function (err) {
  console.log(err);
})

proxy.on('error', function(err, req, res) {
    res.end();
});

var proxy_server = http.createServer(function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    proxy.web(req, res, {
        target: 'http://127.0.0.1:9090',
    });
});

proxy_server.listen(9092, function() {
    console.log('proxy server is running for: 9092');
});


const mime = {
  css: "text/css",
  gif: "image/gif",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  swf: "application/x-shockwave-flash",
  tiff: "image/tiff",
  txt: "text/plain",
  wav: "audio/x-wav",
  wma: "audio/x-ms-wma",
  wmv: "video/x-ms-wmv",
  xml: "text/xml",
};
const port = 9091;

const httpServer = http.createServer((request, response) => {
  const requestUrl = request.url;
  let pathName = url.parse(requestUrl).pathname;

  // 对路径解码，防止中文乱码
  pathName = decodeURI(pathName);

  // 如果既不是访问路径，也不是访问文件，则进行重定向，访问路径
  if (!pathName.endsWith("/") && path.extname(pathName) === "") {
    pathName += "/";
    const redirect = "http://" + request.headers.host + pathName;
    response.writeHead(301, {
      location: redirect,
    });

    response.end(); // 关闭本次对话，也可以写入HTTP回应的具体内容
  }

  // 绝对路径
  const filePath = path.resolve(__dirname + pathName);

  // 扩展名
  let ext = path.extname(pathName);
  ext = ext ? ext.slice(1) : "unknown";

  // 未知的类型一律用"text/plain"类型
  const contentType = mime[ext] || "text/plain";

  // fs.stat()方法用于判断给定的路径是否存在
  fs.stat(filePath, (err, stats) => {
    // 路径不存在，则返回404
    if (err) {
      response.writeHead(404, { "content-type": "text/html" });
      response.end("<h1>404 Not Found</h1>");
    }
    // 如果是文件
    if (!err && stats.isFile()) {
      response.writeHead(200, { "content-type": contentType });
      // 建立流对象，读文件
      const stream = fs.createReadStream(filePath);
      // 错误处理
      stream.on("error", function () {
        response.writeHead(500, { "content-type": contentType });

        response.end("<h1>500 Server Error</h1>");
      });
      // 读取文件
      stream.pipe(response);
      // response.end(); // 这个地方有坑，加了会关闭对话，看不到内容了
    }
    // 如果是路径
    if (!err && stats.isDirectory()) {
      let html = " <head><meta charset = 'utf-8'/></head>";
      // 读取该路径下文件
      fs.readdir(filePath, (err, files) => {
        if (err) {
          response.writeHead(500, { "content-type": contentType });
          response.end("<h1>路径读取失败！</h1>");
        } else {
          for (const file of files) {
            if (file === "index.html") {
              response.writeHead(200, { "content-type": "text/html" });
              response.end(file);
              break;
            }
            html += `<div><a href='${file}'>${file}</a></div>`;
          }
          response.writeHead(200, { "content-type": "text/html" });
          response.end(html);
        }
      });
    }
  });
});

httpServer.listen(port, function () {
  console.log(`File Service: ${port}`);
});

