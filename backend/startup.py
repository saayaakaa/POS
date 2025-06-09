#!/usr/bin/env python3
"""
Azure App Service用スタートアップスクリプト
POSシステム - JANコード形式13桁対応
"""

import os
import sys
import uvicorn
from app import app

if __name__ == "__main__":
    # Azure App Serviceのポート設定
    port = int(os.environ.get("PORT", 8000))
    
    # 本番環境設定
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        access_log=True
    ) 