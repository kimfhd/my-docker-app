FROM python:3.12-slim

WORKDIR /app

COPY app.py .
COPY templates templates

RUN pip install flask flask-socketio eventlet

EXPOSE 5000

CMD ["python", "app.py"]
