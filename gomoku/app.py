from flask import Flask, render_template, request
from flask_socketio import SocketIO, join_room, leave_room, emit
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# 游戏室字典：room_id -> {'board': [[...]], 'players': [sid1, sid2], 'current': 0, 'markers': ['B', 'W']}
rooms = {}

class GomokuBoard:
    def __init__(self):
        self.size = 15
        self.board = [['.' for _ in range(self.size)] for _ in range(self.size)]

    def place(self, x, y, marker):
        if 0 <= x < self.size and 0 <= y < self.size and self.board[x][y] == '.':
            self.board[x][y] = marker
            return True
        return False

    def check_win(self, x, y):
        marker = self.board[x][y]
        directions = [(1, 0), (0, 1), (1, 1), (1, -1)]
        for dx, dy in directions:
            count = 1
            # 正方向
            nx, ny = x + dx, y + dy
            while 0 <= nx < self.size and 0 <= ny < self.size and self.board[nx][ny] == marker:
                count += 1
                nx += dx
                ny += dy
            # 反方向
            nx, ny = x - dx, y - dy
            while 0 <= nx < self.size and 0 <= ny < self.size and self.board[nx][ny] == marker:
                count += 1
                nx -= dx
                ny -= dy
            if count >= 5:
                return True
        return False

    def is_full(self):
        return all(all(cell != '.' for cell in row) for row in self.board)

    def to_list(self):
        return [row[:] for row in self.board]

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('join')
def handle_join(data):
    room_id = data.get('room_id')
    if not room_id:
        room_id = str(random.randint(1000, 9999))  # 新房间
    join_room(room_id)

    if room_id not in rooms:
        rooms[room_id] = {'board': GomokuBoard(), 'players': [], 'current': 0, 'markers': ['B', 'W']}

    room = rooms[room_id]
    if len(room['players']) < 2:
        room['players'].append(request.sid)
        marker = room['markers'][len(room['players']) - 1]
        emit('joined', {'room_id': room_id, 'marker': marker, 'board': room['board'].to_list()})
        if len(room['players']) == 2:
            emit('start', {'board': room['board'].to_list(), 'current': room['markers'][0]}, room=room_id)
    else:
        emit('full', 'Room is full')

@socketio.on('move')
def handle_move(data):
    room_id = data['room_id']
    x, y = data['x'], data['y']
    if room_id in rooms:
        room = rooms[room_id]
        if request.sid == room['players'][room['current']]:
            marker = room['markers'][room['current']]
            if room['board'].place(x, y, marker):
                win = room['board'].check_win(x, y)
                draw = room['board'].is_full() and not win
                emit('update', {'x': x, 'y': y, 'marker': marker, 'win': win, 'draw': draw}, room=room_id)
                if win or draw:
                    del rooms[room_id]  # 游戏结束，清理房间
                else:
                    room['current'] = 1 - room['current']

@socketio.on('disconnect')
def handle_disconnect():
    for room_id in list(rooms.keys()):
        room = rooms[room_id]
        if request.sid in room['players']:
            emit('opponent_left', room=room_id)
            del rooms[room_id]
            break
@socketio.on('restart')
def handle_restart(data):
    room_id = data['room_id']
    if room_id in rooms:
        rooms[room_id]['board'] = GomokuBoard()
        rooms[room_id]['current'] = 0
        emit('restarted', {'board': rooms[room_id]['board'].to_list(), 'current': rooms[room_id]['markers'][0]}, room=room_id)
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
