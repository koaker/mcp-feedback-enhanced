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


def _get_git_info() -> tuple[str, bool]:
    """在运行時获取 git commit 短哈希和脏状态，失败时返回空字符串"""
    try:
        pkg_dir = Path(__file__).resolve().parent.parent

        # 获取短哈希
        hash_result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            cwd=pkg_dir,
            timeout=2,
        )
        if hash_result.returncode != 0:
            return "", False

        git_hash = hash_result.stdout.strip()

        # 检测工作区是否脏（有未提交的改动）
        status_result = subprocess.run(
            ["git", "status", "--porcelain"],
            capture_output=True,
            text=True,
            cwd=pkg_dir,
            timeout=2,
        )
        is_dirty = bool(status_result.stdout.strip())

        return git_hash, is_dirty
    except (FileNotFoundError, subprocess.TimeoutExpired, OSError):
        return "", False


_git_hash, _git_dirty = _get_git_info()
if _git_hash:
    __version__ = f"{__base_version__}+{_git_hash}"
    if _git_dirty:
        __version__ += "-dirty"
else:
    __version__ = __base_version__

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
