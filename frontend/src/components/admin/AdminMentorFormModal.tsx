import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminMentorApi } from '../../lib/adminMentorApi';
import type { AdminMentorInput } from '../../lib/adminMentorApi';
import { adminQueryKeys } from '../../lib/adminQueryKeys';
import { Loader } from '../ui/Loader';

type AdminMentorFormModalProps = {
    isOpen: boolean;
    onClose: () => void;
    mentorId: string | null;
};

export const AdminMentorFormModal: React.FC<AdminMentorFormModalProps> = ({ isOpen, onClose, mentorId }) => {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: mentorId ? adminQueryKeys.mentor(mentorId) : ['adminMentor', 'empty'],
        queryFn: () => adminMentorApi.getMentorById(mentorId!),
        enabled: isOpen && !!mentorId,
    });
    const mentorToEdit = data?.mentor;

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [expertiseArea, setExpertiseArea] = useState('');
    const [level, setLevel] = useState<string>('JUNIOR');
    const [yearsOfExperience, setYearsOfExperience] = useState<number | ''>('');
    const [hourlyRate, setHourlyRate] = useState<number | ''>('');
    const [currentSchool, setCurrentSchool] = useState('');
    const [currentCompany, setCurrentCompany] = useState('');
    const [currentJobTitle, setCurrentJobTitle] = useState('');
    const [consultationLang, setConsultationLang] = useState('vi');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [status, setStatus] = useState<string>('ACTIVE');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const generateSlug = (text: string) => {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D')
            .toLowerCase().trim()
            .replace(/[^a-z0-9 ]/g, '')
            .replace(/\s+/g, '-');
    };

    useEffect(() => {
        if (mentorToEdit) {
            setName(mentorToEdit.name || '');
            setSlug(mentorToEdit.slug || '');
            setTitle(mentorToEdit.title || '');
            setBio(mentorToEdit.bio || '');
            setExpertiseArea(mentorToEdit.expertiseArea || '');
            setLevel(mentorToEdit.level || 'JUNIOR');
            setYearsOfExperience(mentorToEdit.yearsOfExperience ?? '');
            setHourlyRate(mentorToEdit.hourlyRate ?? '');
            setCurrentSchool(mentorToEdit.currentSchool || '');
            setCurrentCompany(mentorToEdit.currentCompany || '');
            setCurrentJobTitle(mentorToEdit.currentJobTitle || '');
            setConsultationLang(mentorToEdit.consultationLang || 'vi');
            setAvatarUrl(mentorToEdit.avatarUrl || '');
            setIsVerified(mentorToEdit.isVerified || false);
            setStatus(mentorToEdit.status || 'ACTIVE');
        } else {
            setName(''); setSlug(''); setTitle(''); setBio('');
            setExpertiseArea(''); setLevel('JUNIOR');
            setYearsOfExperience(''); setHourlyRate('');
            setCurrentSchool(''); setCurrentCompany('');
            setCurrentJobTitle(''); setConsultationLang('vi');
            setAvatarUrl(''); setIsVerified(false); setStatus('ACTIVE');
        }
        setErrorMessage(null);
    }, [mentorToEdit, isOpen]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload: AdminMentorInput = {
                name, slug, title: title || null, bio: bio || null,
                expertiseArea: expertiseArea || null, level: level as any,
                yearsOfExperience: yearsOfExperience === '' ? null : Number(yearsOfExperience),
                hourlyRate: hourlyRate === '' ? null : Number(hourlyRate),
                currentSchool: currentSchool || null, currentCompany: currentCompany || null,
                currentJobTitle: currentJobTitle || null,
                consultationLang: consultationLang || null,
                avatarUrl: avatarUrl || null, isVerified, status: status as any,
            };
            if (mentorToEdit) {
                return adminMentorApi.updateMentor(mentorToEdit.id, payload);
            } else {
                return adminMentorApi.createMentor(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminQueryKeys.mentorsRoot });
            if (mentorId) {
                queryClient.invalidateQueries({ queryKey: adminQueryKeys.mentor(mentorId) });
            }
            setErrorMessage(null);
            onClose();
        },
        onError: (err: Error) => setErrorMessage(err.message || 'Lưu mentor thất bại'),
    });

    if (!isOpen) return null;

    const inputClass = "bg-background border-2 border-secondary rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:border-primary transition-colors";
    const labelClass = "text-xs font-bold uppercase tracking-widest text-muted-foreground";

    return (
        <div className="fixed inset-0 z-[60] flex justify-end animate-in fade-in">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-card w-full max-w-3xl h-full border-l shadow-2xl flex flex-col animate-in slide-in-from-right">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b shrink-0">
                    <div>
                        <h2 className="text-2xl font-black">{mentorToEdit ? 'Sửa Mentor' : 'Tạo Mentor Mới'}</h2>
                        <p className="text-sm font-medium text-muted-foreground">{mentorToEdit ? 'Cập nhật hồ sơ mentor' : 'Thêm mentor mới vào hệ thống'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-secondary rounded-full hover:bg-secondary/70 transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {errorMessage ? (
                    <div className="border-b border-destructive/20 bg-destructive/5 px-6 py-3 text-sm font-medium text-destructive">
                        {errorMessage}
                    </div>
                ) : null}

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 custom-scrollbar">
                    {isLoading && (
                        <div className="flex min-h-[320px] items-center justify-center">
                            <Loader />
                        </div>
                    )}

                    {!isLoading && mentorId && !mentorToEdit && (
                        <div className="flex min-h-[320px] items-center justify-center text-sm font-medium text-muted-foreground">
                            Không thể tải chi tiết mentor.
                        </div>
                    )}

                    {!isLoading && (!mentorId || mentorToEdit) && <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Tên mentor *</label>
                            <input type="text" placeholder="Nguyễn Văn A" className={inputClass} value={name} onChange={e => {
                                setName(e.target.value);
                                if (!mentorToEdit) setSlug(generateSlug(e.target.value));
                            }} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Slug</label>
                            <input type="text" placeholder="nguyen-van-a" className={`${inputClass} font-mono`} value={slug} onChange={e => setSlug(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Chức danh</label>
                        <input type="text" placeholder="Senior Software Engineer" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Giới thiệu (Bio)</label>
                        <textarea rows={3} placeholder="Mô tả ngắn về mentor..." className={`${inputClass} resize-none custom-scrollbar`} value={bio} onChange={e => setBio(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Lĩnh vực chuyên môn</label>
                            <input type="text" placeholder="Frontend, Backend, AI..." className={inputClass} value={expertiseArea} onChange={e => setExpertiseArea(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Cấp độ</label>
                            <select className={inputClass} value={level} onChange={e => setLevel(e.target.value)}>
                                <option value="STUDENT">Sinh viên</option>
                                <option value="FRESHER">Fresher</option>
                                <option value="JUNIOR">Junior</option>
                                <option value="MIDDLE">Middle</option>
                                <option value="SENIOR">Senior</option>
                                <option value="LEAD">Lead</option>
                                <option value="ARCHITECT">Architect</option>
                                <option value="MANAGER">Quản lý</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Kinh nghiệm (năm)</label>
                            <input type="number" min={0} placeholder="5" className={inputClass} value={yearsOfExperience} onChange={e => setYearsOfExperience(e.target.value ? Number(e.target.value) : '')} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Phí tư vấn (VND/h)</label>
                            <input type="number" min={0} placeholder="500000" className={inputClass} value={hourlyRate} onChange={e => setHourlyRate(e.target.value ? Number(e.target.value) : '')} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Ngôn ngữ</label>
                            <input type="text" placeholder="vi, en" className={inputClass} value={consultationLang} onChange={e => setConsultationLang(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Trường học</label>
                            <input type="text" placeholder="HUST, FPT..." className={inputClass} value={currentSchool} onChange={e => setCurrentSchool(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Công ty</label>
                            <input type="text" placeholder="Google, VNG..." className={inputClass} value={currentCompany} onChange={e => setCurrentCompany(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className={labelClass}>Vị trí hiện tại</label>
                            <input type="text" placeholder="Tech Lead" className={inputClass} value={currentJobTitle} onChange={e => setCurrentJobTitle(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className={labelClass}>Avatar URL</label>
                        <input type="text" placeholder="https://..." className={inputClass} value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
                    </div>

                    <div className="p-4 bg-secondary/20 rounded-2xl border flex flex-col gap-4">
                        <h3 className="font-bold text-xs uppercase tracking-widest">Trạng thái & Xác thực</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Trạng thái</label>
                                <select className="bg-background border rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-primary" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="ACTIVE">Active</option>
                                    <option value="PAUSED">Paused</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Xác thực</label>
                                <div className="flex items-center gap-3 h-[34px]">
                                    <input type="checkbox" className="w-4 h-4 accent-primary" checked={isVerified} onChange={e => setIsVerified(e.target.checked)} />
                                    <span className="text-sm font-bold">{isVerified ? 'Đã xác thực' : 'Chưa xác thực'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    </>}
                </div>

                {/* Footer */}
                <div className="p-6 border-t font-mono bg-background flex items-center justify-between shrink-0">
                    <span className="text-xs text-muted-foreground">* Trường bắt buộc</span>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold bg-secondary hover:bg-secondary/70 transition-colors">Hủy Bỏ</button>
                        <button
                            disabled={saveMutation.isPending || !name || !slug}
                            onClick={() => saveMutation.mutate()}
                            className="px-6 py-2.5 rounded-xl font-bold bg-primary text-primary-foreground flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
                        >
                            {saveMutation.isPending ? 'Đang lưu...' : <><Save className="w-4 h-4" /> Lưu Mentor</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
