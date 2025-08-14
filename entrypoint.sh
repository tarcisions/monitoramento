#!/bin/bash

python manage.py migrate

exec gunicorn robot_monitor.wsgi:application --bind 0.0.0.0:8000