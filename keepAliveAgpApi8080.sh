#!/bin/bash
pm2 start --name keepAliveApiTer keepAliveAgp.js -- ApiTer 10.10.0.223 8080
