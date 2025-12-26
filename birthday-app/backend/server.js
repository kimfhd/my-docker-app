const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

// MongoDB 连接配置
//const mongoUrlLocal = 'mongodb://admin:admin.112358@182.92.128.244:207';
const mongoUrlDockerCompose = 'mongodb://admin:112358@mongodb';
const databaseName = 'birthday';
const collectionName = 'messages';

let dbClient;

async function connectToMongoDB() {
    if (!dbClient) {
        try {
            dbClient = await MongoClient.connect(mongoUrlDockerCompose, {
                useUnifiedTopology: true,
                maxPoolSize: 10,
                authSource: 'admin',
            });
            console.log("MongoDB 连接成功");
        } catch (err) {
            console.error("MongoDB 连接失败:", err);
            process.exit(1);
        }
    }
    return dbClient;
}

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, 'frontend')));

// 获取所有祝福
app.get('/greetings', async (req, res) => {
    const { mode } = req.query;

    if (mode && mode !== 'birthdaygirl') {
        return res.status(400).json({ message: '无效的 mode 参数' });
    }

    try {
        const db = (await connectToMongoDB()).db(databaseName);
        const collection = db.collection(collectionName);

        let greetings;
        if (mode === 'birthdaygirl') {
            greetings = await collection.find().sort({ createdAt: -1 }).toArray();
        } else {
            greetings = await collection.find({}, { projection: { name: 0 } }).sort({ createdAt: -1 }).toArray();
        }
        res.json(greetings);
    } catch (err) {
        console.error('加载祝福失败:', err);
        res.status(500).json({ message: '加载失败', error: err.message });
    }
});

// 提交祝福
app.post('/greetings', async (req, res) => {
    const { name, message } = req.body;

    // 数据校验
    if (!name || !message) {
        return res.status(400).json({ message: '请填写完整信息' });
    }

    if (name.length < 1 || message.length < 1) {
        return res.status(400).json({ message: '名字和消息不能为空' });
    }

    if (name.length > 100 || message.length > 1000) {
        return res.status(400).json({ message: '名字或消息过长' });
    }

    try {
        const db = (await connectToMongoDB()).db(databaseName);
        const collection = db.collection(collectionName);

        // 检查用户是否已经发送过祝福
        const existingGreeting = await collection.findOne({ name });
        if (existingGreeting) {
            return res.status(400).json({ message: '你已经发送过祝福了' });
        }

        // 插入新祝福
        const newGreeting = { name, message, likes: 0, likedBy: [], createdAt: new Date() };
        const result = await collection.insertOne(newGreeting);

        if (result.insertedId) {
            res.status(201).json(newGreeting);
        } else {
            res.status(500).json({ message: '发送失败', error: '插入失败' });
        }
    } catch (err) {
        console.error('提交祝福失败:', err);
        res.status(500).json({ message: '发送失败', error: err.message });
    }
});

// 点赞/取消点赞祝福
app.put('/greetings/:id/like', async (req, res) => {
    try {
        const db = (await connectToMongoDB()).db(databaseName);
        const collection = db.collection(collectionName);

        const { userId } = req.body; // 从请求体中获取用户名字
        const greetingId = new ObjectId(req.params.id);

        // 检查用户是否已经点赞过
        const greeting = await collection.findOne({ _id: greetingId });
        if (!greeting) {
            return res.status(404).json({ message: '未找到祝福' });
        }

        const hasLiked = greeting.likedBy.includes(userId);

        // 更新点赞数和记录用户名字
        const result = await collection.updateOne(
            { _id: greetingId },
            { 
                $inc: { likes: hasLiked ? -1 : 1 }, // 增加或减少点赞数
                [hasLiked ? '$pull' : '$push']: { likedBy: userId } // 移除或添加用户名字
            }
        );

        if (result.modifiedCount > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ message: '未找到祝福' });
        }
    } catch (err) {
        console.error('点赞失败:', err);
        res.status(500).json({ message: '点赞失败', error: err.message });
    }
});

// 根路径路由
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'index.html'));
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error handling request:', err);
    res.status(500).json({ message: '服务器错误', error: err.message });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
}).on('error', (err) => {
    console.error('服务器启动失败:', err);
});
