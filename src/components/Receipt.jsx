export default function Receipt({ cart, total, payment, change }) {
  const date = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div id="receipt-content" className="bg-white text-black p-4 w-[300px]">
      <h2 className="text-center font-bold text-lg mb-2">Toko Abinaya Mart</h2>
      <p className="text-center text-sm mb-2">{date}</p>
      <hr className="border-gray-400 mb-2" />
      <div className="text-sm">
        {cart.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span>{item.name} x{item.qty}</span>
            <span>Rp {(item.sellPrice * item.qty).toLocaleString()}</span>
          </div>
        ))}
      </div>
      <hr className="border-gray-400 my-2" />
      <div className="text-sm flex justify-between font-semibold">
        <span>Total</span>
        <span>Rp {total.toLocaleString()}</span>
      </div>
      <div className="text-sm flex justify-between">
        <span>Tunai</span>
        <span>Rp {payment.toLocaleString()}</span>
      </div>
      <div className="text-sm flex justify-between">
        <span>Kembalian</span>
        <span>Rp {change.toLocaleString()}</span>
      </div>
      <hr className="border-gray-400 my-2" />
      <p className="text-center text-xs mt-2">Terima kasih atas kunjungan Anda!</p>
    </div>
  );
}
