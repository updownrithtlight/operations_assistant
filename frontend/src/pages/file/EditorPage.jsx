import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
// 引入你修改后的 api 方法
import { createExcelEditor, getOnlyOfficeConfig, loadOnlyOfficeScript } from "../../api/onlyoffice";

export default function EditorPage() {
  const [sp] = useSearchParams();
  const fileId = sp.get("fileId") || "demo";
  const mode = sp.get("mode") || "edit";

  const boxRef = useRef(null);
  const editorRef = useRef(null); // 用 ref 存 editor 实例，方便销毁
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let canceled = false;

    async function boot() {
      try {
        setErr("");
        setLoading(true);

        // 1. 并行加载：脚本 和 配置 (优化速度)
        // 注意：如果你的 api.js 地址依赖后端返回，则必须串行；如果不依赖，并行最快。
        const [cfg] = await Promise.all([
            getOnlyOfficeConfig({ fileId, mode }),
            loadOnlyOfficeScript()
        ]);

        if (canceled) return;

        // 2. 检查容器是否存在
        if (!boxRef.current) {
            throw new Error("编辑器容器未挂载");
        }

        // 3. 销毁旧实例（防止 React StrictMode 下的双重渲染导致只有骨架没有内容）
        if (editorRef.current?.destroyEditor) {
            editorRef.current.destroyEditor();
            editorRef.current = null;
        }

        // 4. 使用获取到的 cfg 直接初始化
        const { editor } = createExcelEditor(boxRef.current, cfg);
        editorRef.current = editor;

      } catch (e) {
        if (!canceled) {
            console.error(e);
            setErr(e.message || "编辑器加载未知错误");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    boot();

    // 清理函数
    return () => {
      canceled = true;
      if (editorRef.current?.destroyEditor) {
        editorRef.current.destroyEditor();
        editorRef.current = null;
      }
    };
  }, [fileId, mode]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      {/* 重要：id 必须存在且唯一。
         OnlyOffice 会替换这个 div 的内部 HTML，或者在这个 div 里插入 iframe。
      */}
      <div id="onlyoffice-box" ref={boxRef} style={{ height: "100%", width: "100%" }} />

      {loading && (
        <div style={{ position: "absolute", inset: 0, background: "#f5f5f5", zIndex: 10, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <span>加载编辑器资源中...</span>
        </div>
      )}

      {err && (
        <div style={{ position: "absolute", inset: 0, background: "#ffebee", color: "red", padding: 20, zIndex: 20 }}>
          <h3>错误</h3>
          <pre>{err}</pre>
        </div>
      )}
    </div>
  );
}