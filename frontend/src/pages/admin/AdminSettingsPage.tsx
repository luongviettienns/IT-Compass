/**
 * @file AdminSettingsPage.tsx - System settings page (Phase 6).
 *
 * Displays system info and coming-soon sections.
 */

import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Settings, Construction, Server, Shield, Globe, Bell } from 'lucide-react';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const settingSections = [
    { title: 'Cấu hình chung', desc: 'Tên hệ thống, logo, chế độ bảo trì.', icon: Globe },
    { title: 'Quản lý phiên', desc: 'Token lifetime, rate limiting, session policies.', icon: Shield },
    { title: 'Thông báo', desc: 'Email templates, push notification settings.', icon: Bell },
    { title: 'Hệ thống', desc: 'Server info, database status, API health check.', icon: Server },
];

export default function AdminSettingsPage() {
    return (
        <>
            <Helmet>
                <title>Cài đặt — Admin — IT Compass</title>
            </Helmet>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="space-y-8"
            >
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
                    <p className="text-sm text-muted-foreground">
                        Quản lý cấu hình hệ thống IT Compass.
                    </p>
                </div>

                {/* Coming Soon Banner */}
                <div className="rounded-[24px] border border-border/60 bg-background p-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
                        <Construction className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Tính năng đang phát triển</h3>
                        <p className="text-sm text-muted-foreground">
                            Backend chưa có API quản trị cho cài đặt hệ thống. Các sections bên dưới sẽ được kích hoạt khi API sẵn sàng.
                        </p>
                    </div>
                </div>

                {/* Section Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {settingSections.map((section, i) => (
                        <motion.div
                            key={section.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease: EASE }}
                            className="rounded-[20px] border border-border/60 bg-background p-5 opacity-60 cursor-not-allowed"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                                    <section.icon size={18} className="text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold">{section.title}</h3>
                                    <p className="text-xs text-muted-foreground">{section.desc}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground">
                                <Settings className="w-3.5 h-3.5" />
                                Sắp ra mắt
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </>
    );
}
