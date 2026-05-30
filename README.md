# HomeChef Hub - 家庭食谱管理与膳食规划平台

## 功能概览

- 食谱管理：创建/编辑/删除/搜索，分类归档与自定义标签
- 网页导入：从任意食谱网页 URL 一键抓取标题、食材、步骤
- 用户系统：注册/登录（JWT），数据按用户+家庭隔离
- 家庭群组：创建家庭、邀请码加入、成员间共享协作
- 餐食计划：创建周/日计划，将食谱分配到早/午/晚餐/加餐
- 购物清单：从餐食计划自动汇总（按食材+单位合并累加），支持手动增删改

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Python 3.11 · FastAPI · SQLAlchemy · PostgreSQL |
| 前端 | React 18 · Vite · React Router |
| 部署 | Docker · Docker Compose |

## 快速部署（一键启动）

### 前置要求

- Docker ≥ 20.10
- Docker Compose ≥ 2.0（`docker compose` 子命令）

### 启动步骤

```bash
# 1. 克隆项目
git clone <repo-url> && cd HomeChef-Hub

# 2. （可选）修改环境变量
cp .env.example .env
# 编辑 .env 中的 SECRET_KEY 为一个随机字符串

# 3. 构建并启动
docker compose up --build -d

# 4. 查看日志确认启动成功
docker compose logs -f
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:3080 |
| 后端 API | http://localhost:8000 |
| API 文档 (Swagger) | http://localhost:8000/docs |

### 停止服务

```bash
docker compose down          # 停止容器（保留数据）
docker compose down -v       # 停止容器并删除数据卷
```

## 开发模式

### 后端

```bash
cd backend
pip install -r requirements.txt
# 需要本地 PostgreSQL 或修改 DATABASE_URL 指向已有实例
uvicorn app.main:app --reload --port 8000
```

### 前端

```bash
cd frontend
npm install
npm run dev    # 默认 http://localhost:5173，API 请求代理到 backend:8000
```

## 项目结构

```
HomeChef-Hub/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── config.py        # 配置
│   │   ├── database.py      # SQLAlchemy 引擎
│   │   ├── models/          # 数据库模型
│   │   ├── schemas/         # Pydantic 校验
│   │   ├── routers/         # API 路由
│   │   ├── services/        # 业务逻辑（食谱抓取）
│   │   └── utils/           # JWT/密码工具
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   └── services/api.js  # Axios 封装
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .env.example
```
