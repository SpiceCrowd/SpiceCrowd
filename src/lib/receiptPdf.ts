type ReceiptItem = {
  price: number;
  quantity: number;
  slug: string;
};

type PaymentInfo = {
  method?: string;
};

export async function downloadReceiptPdf(items: ReceiptItem[], orderId = `DRAFT_${Date.now()}`, paymentInfo: PaymentInfo = { method: 'cash' }, totalAmount = 0) {
  // dynamic import to avoid SSR issues
  const html2canvasModule = await import('html2canvas').catch(() => null);
  const jspdfModule = await import('jspdf').catch(() => null);
  if (!html2canvasModule || !jspdfModule) {
    throw new Error('html2canvas or jspdf not installed. Run npm install html2canvas jspdf');
  }
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const { jsPDF } = jspdfModule;

  // build a small receipt container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.id = 'spc_receipt_capture';
  container.innerHTML = `
    <div style="font-family:Arial,Helvetica,sans-serif;padding:10px;width:300px">
      <h3 style="margin:0 0 6px 0">Spice Crowd</h3>
      <div style="font-size:12px;margin-bottom:6px">Order: ${orderId}</div>
      <div style="font-size:11px;margin-bottom:8px">${new Date().toLocaleString()}</div>
      <div>${items.map((it) => `<div style=\"display:flex;justify-content:space-between;padding:2px 0\"><div>${it.slug}</div><div>×${it.quantity}</div><div>₹${it.price}</div></div>`).join('')}</div>
      <div style="border-top:1px dashed #000;margin-top:8px;padding-top:6px;display:flex;justify-content:space-between"><strong>Total</strong><strong>₹${totalAmount}</strong></div>
      <div style="font-size:11px;margin-top:6px">Payment: ${paymentInfo?.method || 'cash'}</div>
    </div>
  `;
  document.body.appendChild(container);

  // capture
  const canvas = await html2canvas(container as HTMLElement, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ unit: 'pt', format: [300, canvas.height * (300 / canvas.width)] });
  pdf.addImage(imgData, 'PNG', 0, 0, 300, (canvas.height * 300) / canvas.width);
  pdf.save(`receipt_${orderId}.pdf`);

  // cleanup
  container.remove();
}
