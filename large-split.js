'use strict';

window.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('#splitInput');
  const ranges = document.querySelector('#splitRanges');
  const button = document.querySelector('#splitExport');
  const status = document.querySelector('#splitStatus');
  const fileName = document.querySelector('#splitFileName');
  const row = button && button.parentElement;
  if (!input || !ranges || !button || !status || !row || !window.PDFLib) return;

  const modeLabel = document.createElement('label');
  modeLabel.textContent = '處理模式';
  const mode = document.createElement('select');
  mode.id = 'splitMode';
  mode.innerHTML = '<option value="auto" selected>自動判斷</option><option value="normal">一般 ZIP 模式</option><option value="large">大型 PDF 模式（逐份下載）</option>';
  modeLabel.appendChild(mode);
  row.insertBefore(modeLabel, button);

  let file = null;

  input.onchange = async e => {
    file = e.target.files[0] || null;
    fileName.textContent = file ? file.name : '尚未選擇';
    status.textContent = '';
    if (!file) return;
    try {
      const doc = await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
      const mb = (file.size / 1048576).toFixed(1);
      const recommend = file.size > 80 * 1048576 || doc.numPages >= 300;
      status.textContent = `檔案：${mb} MB｜${doc.numPages} 頁${recommend ? '｜建議使用「大型 PDF 模式」' : ''}`;
      if (doc.destroy) await doc.destroy();
    } catch (err) {
      status.textContent = '無法讀取 PDF 資訊：' + err.message;
    }
  };

  const parsePagesLocal = (s, total) => {
    s = (s || '').trim();
    if (!s) return Array.from({length:total}, (_,i) => i + 1);
    let out = [];
    for (const raw of s.split(',')) {
      const part = raw.trim();
      if (!part) continue;
      if (part.includes('-')) {
        let [a,b] = part.split('-').map(Number);
        if (!Number.isInteger(a) || !Number.isInteger(b)) throw Error('頁碼格式錯誤');
        if (a > b) [a,b] = [b,a];
        for (let i=a;i<=b;i++) out.push(i);
      } else {
        const n = Number(part);
        if (!Number.isInteger(n)) throw Error('頁碼格式錯誤');
        out.push(n);
      }
    }
    out = [...new Set(out)];
    if (out.some(n => n < 1 || n > total)) throw Error('頁碼超出範圍');
    return out;
  };

  const saveLocal = (blob, name) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const breathe = () => new Promise(resolve => setTimeout(resolve, 35));
  const safeName = s => s.replace(/[^0-9_-]/g, '_');

  button.onclick = async () => {
    if (!file) return alert('請選擇 PDF');
    button.disabled = true;
    try {
      const raw = ranges.value.trim();
      if (!raw) throw Error('請輸入拆分範圍');

      status.textContent = '正在載入 PDF…';
      await breathe();
      const src = await PDFLib.PDFDocument.load(await file.arrayBuffer());
      const total = src.getPageCount();
      const chunks = raw.split(',').map(x => x.trim()).filter(Boolean);
      const parsed = chunks.map(ch => ({ch, pages:parsePagesLocal(ch,total)}));
      const totalOutputPages = parsed.reduce((sum,x) => sum + x.pages.length, 0);
      const selectedMode = mode.value;
      const useLarge = selectedMode === 'large' || (selectedMode === 'auto' && (file.size > 80 * 1048576 || total >= 300 || totalOutputPages >= 300));

      if (useLarge) {
        status.textContent = '大型 PDF 模式：每完成一份就立即下載，不建立 ZIP，以降低記憶體占用。若瀏覽器詢問多檔下載，請選擇允許。';
        await breathe();
        for (let i=0;i<parsed.length;i++) {
          const {ch,pages} = parsed[i];
          const out = await PDFLib.PDFDocument.create();
          for (let j=0;j<pages.length;j++) {
            const [page] = await out.copyPages(src,[pages[j]-1]);
            out.addPage(page);
            if ((j+1) % 20 === 0 || j === pages.length-1) {
              status.textContent = `大型 PDF 模式｜第 ${i+1}/${parsed.length} 份｜複製 ${j+1}/${pages.length} 頁`;
              await breathe();
            }
          }
          status.textContent = `大型 PDF 模式｜正在輸出第 ${i+1}/${parsed.length} 份…`;
          const bytes = await out.save({useObjectStreams:true});
          saveLocal(new Blob([bytes],{type:'application/pdf'}), `拆分_${String(i+1).padStart(2,'0')}_${safeName(ch)}.pdf`);
          await breathe();
        }
        status.textContent = `完成，共 ${parsed.length} 個 PDF。大型模式未建立 ZIP，因此較省記憶體。`;
      } else {
        const zip = new JSZip();
        for (let i=0;i<parsed.length;i++) {
          const {ch,pages} = parsed[i];
          status.textContent = `一般 ZIP 模式｜正在處理第 ${i+1}/${parsed.length} 份`;
          const out = await PDFLib.PDFDocument.create();
          for (let j=0;j<pages.length;j++) {
            const [page] = await out.copyPages(src,[pages[j]-1]);
            out.addPage(page);
            if ((j+1) % 25 === 0) await breathe();
          }
          zip.file(`拆分_${String(i+1).padStart(2,'0')}_${safeName(ch)}.pdf`, await out.save({useObjectStreams:true}));
          await breathe();
        }
        status.textContent = '正在建立 ZIP…';
        const blob = await zip.generateAsync({type:'blob',compression:'STORE'}, meta => {
          status.textContent = `正在建立 ZIP… ${Math.round(meta.percent)}%`;
        });
        saveLocal(blob,'PDF拆分.zip');
        status.textContent = `完成，共 ${parsed.length} 個 PDF`;
      }
    } catch (err) {
      status.textContent = '拆分未完成';
      alert('拆分失敗：' + err.message + '\n\n若是大型 PDF，請改用「大型 PDF 模式」。');
    } finally {
      button.disabled = false;
    }
  };
});
