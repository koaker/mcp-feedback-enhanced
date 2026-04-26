#!/usr/bin/env python3
"""
統一調試日誌模組
================

提供統一的調試日誌功能，確保調試輸出不會干擾 MCP 通信。
所有調試輸出都會發送到 stderr，並且只在調試模式啟用時才輸出。

使用方法：
```python
from .debug import debug_log

debug_log("這是一條調試信息")
```

環境變數控制：
- MCP_DEBUG=true/1/yes/on: 啟用調試模式
- MCP_DEBUG=false/0/no/off: 關閉調試模式（默認）

作者: Minidoracat
"""

import os
import sys
import time
from collections import deque
from typing import Any


# 内存日志缓冲区（最多保留 500 条）
_log_buffer: deque = deque(maxlen=500)


def _record_log(level: str, prefix: str, message: str) -> None:
    """将日志写入内存缓冲区"""
    _log_buffer.append({
        "ts": time.time(),
        "level": level,
        "prefix": prefix,
        "message": message,
    })


def get_log_buffer(tail: int = 100) -> list:
    """返回最近 tail 条日志记录"""
    entries = list(_log_buffer)
    return entries[-tail:] if tail < len(entries) else entries


def clear_log_buffer() -> None:
    """清空日志缓冲区"""
    _log_buffer.clear()


def debug_log(message: Any, prefix: str = "DEBUG") -> None:
    """
    輸出調試訊息到標準錯誤，避免污染標準輸出

    Args:
        message: 要輸出的調試信息
        prefix: 調試信息的前綴標識，默認為 "DEBUG"
    """
    try:
        # 確保消息是字符串類型
        if not isinstance(message, str):
            message = str(message)

        # 始终记录到内存缓冲区
        _record_log("DEBUG", prefix, message)

        # 只在啟用調試模式時才輸出到 stderr，避免干擾 MCP 通信
        if os.getenv("MCP_DEBUG", "").lower() not in ("true", "1", "yes", "on"):
            return

        # 安全地輸出到 stderr，處理編碼問題
        try:
            print(f"[{prefix}] {message}", file=sys.stderr, flush=True)
        except UnicodeEncodeError:
            # 如果遇到編碼問題，使用 ASCII 安全模式
            safe_message = message.encode("ascii", errors="replace").decode("ascii")
            print(f"[{prefix}] {safe_message}", file=sys.stderr, flush=True)
    except Exception:
        # 最後的備用方案：靜默失敗，不影響主程序
        pass


def info_log(message: Any, prefix: str = "INFO") -> None:
    """记录 INFO 级别日志（始终写入缓冲区）"""
    try:
        if not isinstance(message, str):
            message = str(message)
        _record_log("INFO", prefix, message)
    except Exception:
        pass


def warn_log(message: Any, prefix: str = "WARN") -> None:
    """记录 WARN 级别日志（始终写入缓冲区）"""
    try:
        if not isinstance(message, str):
            message = str(message)
        _record_log("WARN", prefix, message)
    except Exception:
        pass


def error_log(message: Any, prefix: str = "ERROR") -> None:
    """记录 ERROR 级别日志（始终写入缓冲区并输出到 stderr）"""
    try:
        if not isinstance(message, str):
            message = str(message)
        _record_log("ERROR", prefix, message)
        print(f"[{prefix}] {message}", file=sys.stderr, flush=True)
    except Exception:
        pass


def i18n_debug_log(message: Any) -> None:
    """國際化模組專用的調試日誌"""
    debug_log(message, "I18N")


def server_debug_log(message: Any) -> None:
    """伺服器模組專用的調試日誌"""
    debug_log(message, "SERVER")


def web_debug_log(message: Any) -> None:
    """Web UI 模組專用的調試日誌"""
    debug_log(message, "WEB")


def is_debug_enabled() -> bool:
    """檢查是否啟用了調試模式"""
    return os.getenv("MCP_DEBUG", "").lower() in ("true", "1", "yes", "on")


def set_debug_mode(enabled: bool) -> None:
    """設置調試模式（用於測試）"""
    os.environ["MCP_DEBUG"] = "true" if enabled else "false"
