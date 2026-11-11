import { TemplateStatus, TemplateType, Tenant } from "@/constants/template";
import { addDays, now } from "@/lib/dates";
import type { Language } from "@/types/language";
import type { ReleaseVersion, Template, TemplateContent } from "@/types/template";

// Languages the Notification service sends templates in.
export const TEMPLATE_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية" },
  { code: "my", name: "Burmese", nativeName: "မြန်မာ" },
  { code: "zh-Hans", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "km", name: "Khmer", nativeName: "ខ្មែរ" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "mn", name: "Mongolian", nativeName: "Монгол" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
];

export const getTemplateLanguage = (code: string) =>
  TEMPLATE_LANGUAGES.find((language) => language.code === code)!;

// Newest first.
export const RELEASE_VERSIONS: ReleaseVersion[] = [
  { id: 5, versionNumber: "12.5" },
  { id: 4, versionNumber: "12.4" },
  { id: 3, versionNumber: "12.3" },
];

export const getRelease = (id: number | null) =>
  RELEASE_VERSIONS.find((release) => release.id === id);

let nextContentId = 1;

const content = (
  language: string,
  releaseId: number | null,
  status: TemplateStatus,
  updatedBy: string,
  daysAgo: number,
  values: Pick<TemplateContent, "body"> &
    Partial<Pick<TemplateContent, "title" | "phoneCodes" | "syncedAt">>,
): TemplateContent => ({
  id: `content-${nextContentId++}`,
  language,
  releaseId,
  status,
  updatedBy,
  updatedAt: addDays(now, -daysAgo),
  title: values.title ?? null,
  body: values.body,
  phoneCodes: values.phoneCodes ?? [],
  syncedAt: values.syncedAt,
});

const synced = (daysAgo: number, tenants: Tenant[] = [Tenant.US, Tenant.China, Tenant.Russia]) =>
  Object.fromEntries(tenants.map((tenant) => [tenant, addDays(now, -daysAgo)]));

const CLASSES_ASSIGNED_EN_12_4 = [
  '<h2 style="text-align: center">New classes for you</h2>',
  "<p>Hi <strong>{TeacherName}</strong>,</p>",
  "<p>You have been assigned to <strong>{ClassNames}</strong> at {SchoolName}.</p>",
  '<ul><li><p>Check the class schedule before the first lesson.</p></li><li><p>Review the <span style="color: #2563eb">lesson plans</span> for each unit.</p></li></ul>',
  "<p>#[Open School Site](https://school.grapeseed.com/classes) to see your classes.</p>",
  "<p><br></p>",
  '<p style="text-align: center"><em>The GrapeSEED team</em></p>',
].join("");

const CLASSES_ASSIGNED_EN_12_5 = [
  '<h2 style="text-align: center">New classes for you</h2>',
  "<p>Hi <strong>{TeacherName}</strong>,</p>",
  "<p>You have been assigned to <strong>{ClassNames}</strong> at {SchoolName}, starting on {Date}.</p>",
  '<ul><li><p>Check the class schedule before the first lesson.</p></li><li><p>Review the <span style="color: #2563eb">lesson plans</span> and <strong>unit assessments</strong>.</p></li></ul>',
  "<p>#[Open School Site](https://school.grapeseed.com/classes) to see your classes.</p>",
  "<p><br></p>",
  '<p style="text-align: center"><em>The GrapeSEED team</em></p>',
].join("");

const CLASSES_ASSIGNED_VI_12_4 = [
  '<h2 style="text-align: center">Lớp học mới dành cho bạn</h2>',
  "<p>Chào <strong>{TeacherName}</strong>,</p>",
  "<p>Bạn đã được phân công dạy <strong>{ClassNames}</strong> tại {SchoolName}.</p>",
  '<ul><li><p>Hãy xem lịch học trước buổi học đầu tiên.</p></li><li><p>Xem lại <span style="color: #2563eb">giáo án</span> của từng bài.</p></li></ul>',
  "<p>#[Mở School Site](https://school.grapeseed.com/classes) để xem các lớp của bạn.</p>",
  "<p><br></p>",
  '<p style="text-align: center"><em>Đội ngũ GrapeSEED</em></p>',
].join("");

const CLASSES_ASSIGNED_JA_12_5 = [
  '<h2 style="text-align: center">新しいクラスのお知らせ</h2>',
  "<p><strong>{TeacherName}</strong> 先生、</p>",
  "<p>{SchoolName} の <strong>{ClassNames}</strong> の担当になりました。{Date} から開始します。</p>",
  "<ul><li><p></p></li><li><p></p></li></ul>",
  "<p></p>",
  "<p><br></p>",
  '<p style="text-align: center"><em>GrapeSEED チーム</em></p>',
].join("");

const RESET_PASSWORD_EN = (minutes: string) =>
  [
    "<p>Hi {UserName},</p>",
    `<p>We received a request to reset your password. The link below works for <strong>${minutes}</strong>.</p>`,
    '<p><a href="{Link}" target="_blank" rel="noopener noreferrer nofollow">Reset my password</a></p>',
    '<p style="color: #64748b">If you did not ask for this, you can ignore this email.</p>',
  ].join("");

const RESET_PASSWORD_VI = (minutes: string) =>
  [
    "<p>Xin chào {UserName},</p>",
    `<p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu của bạn. Liên kết dưới đây có hiệu lực trong <strong>${minutes}</strong>.</p>`,
    '<p><a href="{Link}" target="_blank" rel="noopener noreferrer nofollow">Đặt lại mật khẩu</a></p>',
    '<p style="color: #64748b">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>',
  ].join("");

const PARENT_INVITATION_EN = [
  "<h1>Welcome to GrapeSEED</h1>",
  "<p>Hi {ParentName},</p>",
  "<p>{SchoolName} has invited you to follow <strong>{StudentName}</strong>'s English learning at home.</p>",
  "<ol>",
  "<li><p>Install the GrapeSEED Parent app.</p></li>",
  "<li><p>Sign in with <strong>{Email}</strong>.</p></li>",
  '<li><p>Enter the invitation code <span style="background-color: #fef3c7"><strong>{Code}</strong></span>.</p></li>',
  "</ol>",
  "<p>The code expires on {Date}.</p>",
].join("\n");

const PRIVACY_POLICY_EN = [
  "<h1>Privacy Policy</h1>",
  "<p><em>Last updated: {Date}</em></p>",
  "<p>This Privacy Policy explains how <strong>GrapeSEED</strong> collects, uses and protects information when you use our sites and apps.</p>",
  "<h2>1. Information we collect</h2>",
  "<ul>",
  "  <li><p><strong>Account information:</strong> name, email address, school and role.</p></li>",
  "  <li><p><strong>Learning data:</strong> lessons completed, recordings and progress reports.</p></li>",
  "  <li><p><strong>Device data:</strong> device type, operating system and app version.</p></li>",
  "</ul>",
  "<h2>2. How we use information</h2>",
  "<p>We use this information to deliver lessons, report progress to teachers and parents, and keep our services secure.</p>",
  "<h2>3. Children's privacy</h2>",
  "<p>Student accounts are created by schools. We never sell children's data or use it for advertising.</p>",
  "<h2>4. Your choices</h2>",
  '<p>You can update your account details at any time in <a href="https://account.grapeseed.com/profile" target="_blank" rel="noopener noreferrer nofollow">your profile</a>.</p>',
  "<h2>5. Contact us</h2>",
  '<p>Questions? Write to <a href="mailto:privacy@grapeseed.com">privacy@grapeseed.com</a>.</p>',
].join("\n");

const TERMS_EN = [
  "<h1>Terms of Service</h1>",
  "<p>By using GrapeSEED sites and apps you agree to these terms.</p>",
  "<h2>Accounts</h2>",
  "<p>Keep your password private. You are responsible for all activity on your account.</p>",
  "<h2>Acceptable use</h2>",
  "<p>Use GrapeSEED for learning and teaching only. Do not share lesson content outside your school.</p>",
  "<h2>Changes</h2>",
  "<p>We may update these terms. We will tell you about <strong>important changes</strong> by email or in the app.</p>",
].join("\n");

const TERMS_VI = [
  "<h1>Điều khoản dịch vụ</h1>",
  "<p>Khi sử dụng các trang web và ứng dụng GrapeSEED, bạn đồng ý với các điều khoản này.</p>",
  "<h2>Tài khoản</h2>",
  "<p>Hãy giữ bí mật mật khẩu. Bạn chịu trách nhiệm cho mọi hoạt động trên tài khoản của mình.</p>",
  "<h2>Sử dụng hợp lệ</h2>",
  "<p>Chỉ sử dụng GrapeSEED cho việc học và giảng dạy. Không chia sẻ nội dung bài học ra ngoài trường.</p>",
  "<h2>Thay đổi</h2>",
  "<p>Chúng tôi có thể cập nhật các điều khoản này. Chúng tôi sẽ thông báo <strong>các thay đổi quan trọng</strong> qua email hoặc trong ứng dụng.</p>",
].join("\n");

export const TEMPLATES: Template[] = [
  {
    id: "tpl-classes-assigned",
    code: "AdminService_Email_ClassesAssigned",
    name: "Classes assigned",
    type: TemplateType.Email,
    service: "AdminService",
    description: "Sent to a teacher when a school admin assigns them to one or more classes.",
    contents: [
      content("en", 4, TemplateStatus.Published, "Logan Le", 40, {
        title: "New classes assigned at {SchoolName}",
        body: CLASSES_ASSIGNED_EN_12_4,
        syncedAt: synced(38),
      }),
      content("en", 5, TemplateStatus.Draft, "Emily Chen", 2, {
        title: "You have new classes at {SchoolName}",
        body: CLASSES_ASSIGNED_EN_12_5,
      }),
      content("vi", 4, TemplateStatus.Published, "Mai Nguyen", 35, {
        title: "Lớp học mới được phân công tại {SchoolName}",
        body: CLASSES_ASSIGNED_VI_12_4,
        syncedAt: synced(30, [Tenant.US, Tenant.China]),
      }),
      content("ja", 5, TemplateStatus.Draft, "Kenji Sato", 1, {
        title: "{SchoolName} で新しいクラスが割り当てられました",
        body: CLASSES_ASSIGNED_JA_12_5,
      }),
    ],
  },
  {
    id: "tpl-reset-password",
    code: "AccountService_Email_ResetPassword",
    name: "Reset your password",
    type: TemplateType.Email,
    service: "AccountService",
    description: "Password reset link, requested from the sign-in page.",
    contents: [
      content("en", 3, TemplateStatus.Archived, "Logan Le", 120, {
        title: "Reset your GrapeSEED password",
        body: RESET_PASSWORD_EN("30 minutes"),
      }),
      content("en", 4, TemplateStatus.Published, "Logan Le", 60, {
        title: "Reset your GrapeSEED password",
        body: RESET_PASSWORD_EN("{Minutes} minutes"),
        syncedAt: synced(58),
      }),
      content("vi", 3, TemplateStatus.Archived, "Thu Ha", 110, {
        title: "Đặt lại mật khẩu GrapeSEED",
        body: RESET_PASSWORD_VI("30 phút"),
      }),
      content("vi", 4, TemplateStatus.Published, "Thu Ha", 50, {
        title: "Đặt lại mật khẩu GrapeSEED",
        body: RESET_PASSWORD_VI("{Minutes} phút"),
        syncedAt: synced(45),
      }),
      content("ko", 4, TemplateStatus.Published, "Ji-woo Park", 48, {
        title: "GrapeSEED 비밀번호 재설정",
        body: [
          "<p>{UserName}님, 안녕하세요.</p>",
          "<p>비밀번호 재설정 요청을 받았습니다. 아래 링크는 <strong>{Minutes}분</strong> 동안 유효합니다.</p>",
          '<p><a href="{Link}" target="_blank" rel="noopener noreferrer nofollow">비밀번호 재설정</a></p>',
          '<p style="color: #64748b">요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>',
        ].join(""),
      }),
    ],
  },
  {
    id: "tpl-parent-invitation",
    code: "ParentSite_Email_ParentInvitation",
    name: "Parent invitation",
    type: TemplateType.Email,
    service: "ParentSite",
    description: "Invites a parent to the Parent app with a one-time code. New in 12.5.",
    contents: [
      content("en", 5, TemplateStatus.Draft, "Anh Vo", 3, {
        title: "Join {StudentName} on GrapeSEED",
        body: PARENT_INVITATION_EN,
      }),
    ],
  },
  {
    id: "tpl-verification-code",
    code: "AccountService_Sms_VerificationCode",
    name: "Verification code",
    type: TemplateType.Sms,
    service: "AccountService",
    description: "One-time code for sign-in and phone number checks.",
    contents: [
      content("en", 4, TemplateStatus.Published, "Logan Le", 90, {
        body: "Your GrapeSEED verification code is {Code}. It expires in {Minutes} minutes.",
        phoneCodes: ["+1", "+44", "+61"],
        syncedAt: synced(88),
      }),
      content("vi", 4, TemplateStatus.Published, "Chuong Tran", 80, {
        body: "Mã xác minh GrapeSEED của bạn là {Code}. Mã hết hạn sau {Minutes} phút.",
        phoneCodes: ["+84"],
        syncedAt: synced(78),
      }),
      content("ja", 4, TemplateStatus.Published, "Kenji Sato", 82, {
        body: "GrapeSEED の認証コードは {Code} です。{Minutes} 分間有効です。",
        phoneCodes: ["+81"],
      }),
    ],
  },
  {
    id: "tpl-class-cancelled",
    code: "SchoolSite_Sms_ClassCancelled",
    name: "Class cancelled",
    type: TemplateType.Sms,
    service: "SchoolSite",
    description: "Tells parents that a lesson is cancelled.",
    contents: [
      content("en", 4, TemplateStatus.Published, "Duc Hoang", 30, {
        body: "{SchoolName}: {ClassName} on {Date} is cancelled. We will contact you about a make-up lesson.",
        phoneCodes: ["+1", "+44", "+61"],
      }),
      content("vi", 5, TemplateStatus.Draft, "Chuong Tran", 1, {
        body: "{SchoolName}: Lớp {Classname} ngày {Date} bị hủy. Chúng tôi sẽ liên hệ với bạn về buổi học bù.",
        phoneCodes: ["+84"],
      }),
    ],
  },
  {
    id: "tpl-payment-reminder",
    code: "ParentSite_Sms_PaymentReminder",
    name: "Payment reminder",
    type: TemplateType.Sms,
    service: "ParentSite",
    description: null,
    contents: [
      content("en", 4, TemplateStatus.Published, "Anh Vo", 25, {
        body: "Reminder: {Amount} for {StudentName} is due on {Date}. Pay online at {Link}",
        phoneCodes: ["+1", "+44", "+61"],
      }),
    ],
  },
  {
    id: "tpl-privacy-policy",
    code: "AccountSite_PrivacyPolicy_PrivacyPolicy",
    name: "Privacy policy",
    type: TemplateType.PrivacyPolicy,
    service: "AccountSite",
    description: "Shown at sign-up and in the footer of every site.",
    contents: [
      content("en", 4, TemplateStatus.Published, "Huy Pham", 45, {
        body: PRIVACY_POLICY_EN,
        syncedAt: synced(44),
      }),
    ],
  },
  {
    id: "tpl-terms-of-service",
    code: "AccountSite_TermsOfService_TermsOfService",
    name: "Terms of service",
    type: TemplateType.TermsOfService,
    service: "AccountSite",
    description: "Users accept these terms when they create an account.",
    contents: [
      content("en", 4, TemplateStatus.Published, "Huy Pham", 50, {
        body: TERMS_EN,
        syncedAt: synced(49),
      }),
      content("vi", 4, TemplateStatus.Published, "Mai Nguyen", 20, {
        body: TERMS_VI,
        syncedAt: { ...synced(19, [Tenant.US, Tenant.China]), [Tenant.Russia]: addDays(now, -40) },
      }),
    ],
  },
  {
    id: "tpl-maintenance",
    code: "NotificationService_Others_ScheduledMaintenance",
    name: "Scheduled maintenance",
    type: TemplateType.Others,
    service: "NotificationService",
    description: "Banner shown in every site before planned downtime.",
    contents: [
      content("en", 5, TemplateStatus.Draft, "Logan Le", 4, {
        title: "Scheduled maintenance on {Date}",
        body: "<p>GrapeSEED will be unavailable from <strong>{StartTime}</strong> to <strong>{EndTime}</strong> on {Date} for scheduled maintenance.</p><p>Please save your work before then. We apologise for the inconvenience.</p>",
      }),
      content("vi", 5, TemplateStatus.Draft, "Mai Nguyen", 1, {
        title: "Bảo trì định kỳ ngày {Date}",
        body: "<p>GrapeSEED sẽ tạm ngừng hoạt động từ <strong>{StartTime}</strong> đến <strong>{EndTime}</strong> ngày {Date} để bảo trì định kỳ.</p><p>Vui lòng lưu công việc trước thời gian này. Xin lỗi vì sự bất tiện.</p>",
      }),
    ],
  },
  {
    id: "tpl-weekly-progress",
    code: "REPService_Email_WeeklyProgressSummary",
    name: "Weekly progress summary",
    type: TemplateType.Email,
    service: "REPService",
    description: "Created in Notification, English not written yet.",
    contents: [],
  },
];
