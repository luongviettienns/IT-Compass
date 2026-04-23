import { Settings, Construction } from 'lucide-react';

export default function AdminSettingsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
            <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Construction className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
                <p className="text-muted-foreground max-w-md">
                    Khu vực này hiện chỉ là placeholder. Backend chưa có API quản trị cho cài đặt hệ thống, nên frontend chưa hiển thị form lưu cấu hình để tránh tạo kỳ vọng sai.
                </p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-xl px-4 py-2 text-sm font-bold">
                <Settings className="w-4 h-4" />
                Đang phát triển
            </div>
        </div>
    );
}
