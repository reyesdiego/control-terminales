#!/bin/bash
pm2 start --name keepAliveApiWeb keepAliveAgp.js -- ApiWeb 10.10.0.223 8090
