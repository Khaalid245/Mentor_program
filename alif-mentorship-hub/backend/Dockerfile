# ----------------------------
# 1. Base image
# ----------------------------
FROM python:3.10-slim

# ----------------------------
# 2. Set working directory
# ----------------------------
WORKDIR /app

# ----------------------------
# 3. Install system dependencies for mysqlclient
# ----------------------------
RUN apt-get update && apt-get install -y \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ----------------------------
# 4. Copy requirements and install Python dependencies
# ----------------------------
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# ----------------------------
# 5. Copy the Django project files
# ----------------------------
COPY . .

# ----------------------------
# 6. Set environment variables
# ----------------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ----------------------------
# 7. Expose port and run Django
# ----------------------------
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
