"use client";

export function DeviceGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* PC専用案内 - 画面幅1024px未満で表示 */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center lg:hidden">
        <h1 className="mb-4 text-2xl font-bold text-gray-800">さくっと印字</h1>
        <p className="mb-2 text-gray-600">
          このアプリはPC専用です。
        </p>
        <p className="mb-6 text-gray-600">
          画面幅1024px以上のPC環境からアクセスしてください。
        </p>
        <p className="text-sm text-gray-400">
          テキスト配置・印刷設定にはマウス操作と大きな画面が必要です。
        </p>
      </div>

      {/* アプリ本体 - 画面幅1024px以上で表示 */}
      <div className="hidden lg:block">
        {children}
      </div>
    </>
  );
}
