#!/usr/bin/env python3
"""
MCP Interactive Feedback Enhanced
==================================

互動式用戶回饋 MCP 伺服器，提供 AI 輔助開發中的回饋收集功能。

作者: Fábio Ferreira
增強功能: Web UI 支援、圖片上傳、現代化界面設計

特色：
- Web UI 介面支援
- 智慧環境檢測
- 命令執行功能
- 圖片上傳支援
- 現代化深色主題
- 重構的模組化架構
"""

import os
import subprocess
from pathlib import Path

# 基礎版本號
__base_version__ = "2.6.0"
__author__ = "Minidoracat"
__email__ = "minidora0702@gmail.com"


def _get_git_hash() -> str:
    """在运行時获取当前 git commit 短哈希，失败时返回空字符串"""
    try:
        # 定位包根目錄（当前文件所在目录的父目录）
        pkg_dir = Path(__file__).resolve().parent.parent
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            cwd=pkg_dir,
            timeout=2,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        pass
    return ""


_git_hash = _get_git_hash()
__version__ = f"{__base_version__}+{_git_hash}" if _git_hash else __base_version__

from .server import main as run_server

# 導入新的 Web UI 模組
from .web import WebUIManager, get_web_ui_manager, launch_web_feedback_ui, stop_web_ui


# 主要導出介面
__all__ = [
    "WebUIManager",
    "__author__",
    "__version__",
    "get_web_ui_manager",
    "launch_web_feedback_ui",
    "run_server",
    "stop_web_ui",
]


def main():
    """主要入口點，用於 uvx 執行"""
    from .__main__ import main as cli_main

    return cli_main()
