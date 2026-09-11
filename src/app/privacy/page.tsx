import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "개인정보 처리방침",
  description: "Nexus 학생회 통합 운영체제 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/40 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>로그인 화면으로 돌아가기</span>
          </Link>
          <span className="text-xs text-muted-foreground">시행일자: 2026년 9월 1일</span>
        </div>

        {/* Card Content */}
        <div className="rounded-2xl border bg-card p-6 sm:p-10 shadow-xs space-y-8">
          <div className="border-b pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold">
              <Lock className="size-3.5" />
              <span>개인정보보호</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Nexus 개인정보 처리방침
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nexus(이하 &quot;서비스&quot;)는 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고
              이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-foreground/90 leading-relaxed">
            {/* 제1조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제1조 (개인정보의 처리 목적)</h2>
              <p>서비스는 다음의 목적을 위하여 최소한의 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법률에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">학생회 회원 가입 및 본인 확인:</strong> 대학교 학생 자치기구 소속 확인, 임원/부원 권한 부여, 학생회 조직 인수인계.</li>
                <li><strong className="text-foreground">축제 및 부스·행사 티켓 관리:</strong> 참가 신청 접수, QR/바코드 티켓 발권, 행사 당일 현장 입장 확인(Check-in) 및 혼잡도 관리.</li>
                <li><strong className="text-foreground">회계 예결산 및 감사 증빙:</strong> 학생회비 집행 적격 증빙 영수증 등록, 지출 결의서 결재 및 감사 보고서 작성.</li>
                <li><strong className="text-foreground">학생 소통 및 공론장 운영:</strong> 학생 청원 작성 및 지지 서명, 캠퍼스 라이브 투표 중복 방지.</li>
              </ul>
            </section>

            {/* 제2조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제2조 (처리하는 개인정보의 항목)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border rounded-md text-xs">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2.5 border font-semibold">구분</th>
                      <th className="p-2.5 border font-semibold">수집 항목</th>
                      <th className="p-2.5 border font-semibold">수집 목적</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-muted-foreground">
                    <tr>
                      <td className="p-2.5 border font-medium text-foreground">학생회 회원가입</td>
                      <td className="p-2.5 border">[필수] 이름, 이메일, 비밀번호, 소속 대학교</td>
                      <td className="p-2.5 border">회원 식별, 로그인 및 계정 보안</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-medium text-foreground">조직 가입 신청</td>
                      <td className="p-2.5 border">[필수] 부서, 직책, 학번</td>
                      <td className="p-2.5 border">학생회 내부 조직도 구성 및 역할 배정</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-medium text-foreground">행사/티켓 신청</td>
                      <td className="p-2.5 border">[필수] 이름, 연락처(휴대폰), 학번 / [선택] 이메일, 추가 설문 답변</td>
                      <td className="p-2.5 border">티켓 발급, 입장 확인 및 비상 연락</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-medium text-foreground">회계 지출 등록</td>
                      <td className="p-2.5 border">[선택] 영수증 사진(거래처명, 결제금액, 결제시각 포함)</td>
                      <td className="p-2.5 border">학생회비 감사 증빙 보관</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 border font-medium text-foreground">서비스 이용 과정</td>
                      <td className="p-2.5 border">IP 주소, 쿠키, 서비스 이용기록, 기기 식별값</td>
                      <td className="p-2.5 border">부정 이용 방지, 통계 및 투표 중복 검증</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 제3조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제3조 (개인정보의 처리 및 보유 기간)</h2>
              <p>
                1. 서비스는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보 수집 시에 동의받은 보유·이용 기간 내에서 개인정보를 처리·보유합니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">회원 정보:</strong> 회원 탈퇴 시 또는 학생회 제명 시 지체 없이 파기.</li>
                <li><strong className="text-foreground">행사 및 티켓 신청 정보:</strong> 행사 종료일로부터 30일 보관 후 영구 파기 (단, 부정 입장 방지 및 사후 확인 목적).</li>
                <li><strong className="text-foreground">회계 및 결산 감사 증빙:</strong> 대학 학생 자치회계 규약 및 회계연도 감사 완료 시까지 (통상 1년~3년) 보존.</li>
              </ul>
            </section>

            {/* 제4조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제4조 (개인정보의 제3자 제공 및 위탁)</h2>
              <p>
                1. 서비스는 정보주체의 사전 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
              </p>
              <p>
                2. 원활한 서비스 제공을 위해 다음과 같이 클라우드 전문 인프라에 처리를 위탁하고 있습니다:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">Supabase Inc.:</strong> 데이터베이스 호스팅, 암호화 인증(Auth), 스토리지(Storage) 보관.</li>
                <li><strong className="text-foreground">Vercel Inc.:</strong> 글로벌 CDN 웹 애플리케이션 호스팅 및 트래픽 분산.</li>
              </ul>
            </section>

            {/* 제5조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제5조 (정보주체의 권리와 그 행사방법)</h2>
              <p>
                1. 정보주체는 언제든지 본인의 개인정보에 대하여 열람, 정정, 삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.
              </p>
              <p>
                2. 권리 행사는 서비스 내 [내 프로필] 설정 또는 개인정보 보호책임자에게 전자우편을 통해 가능하며, 지체 없이 조치하겠습니다.
              </p>
            </section>

            {/* 제6조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제6조 (개인정보의 안전성 확보 조치)</h2>
              <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 관리적·기술적 보호조치를 취하고 있습니다:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li><strong className="text-foreground">전송 구간 암호화:</strong> HTTPS 및 최신 TLS 암호화 프로토콜을 전면 적용하여 전송 중 도청 방지.</li>
                <li><strong className="text-foreground">행 단위 보안(Row Level Security):</strong> 데이터베이스 차원에서 타 학생회나 비인가자가 타인의 데이터를 조회할 수 없도록 격리.</li>
                <li><strong className="text-foreground">비밀번호 단방향 암호화:</strong> 회원의 비밀번호는 복호화 불가능한 안전한 솔트 해시(Argon2/Bcrypt)로 저장.</li>
              </ul>
            </section>

            {/* 제7조 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제7조 (개인정보 보호책임자 및 연락처)</h2>
              <div className="p-4 rounded-xl bg-muted/60 border space-y-1 text-xs">
                <p><strong className="text-foreground">개인정보 보호책임자:</strong> Nexus 개발 및 운영총괄</p>
                <p><strong className="text-foreground">문의 및 침해 신고:</strong> privacy@nexus-campus.org</p>
                <p><strong className="text-foreground">권익침해 구제 안내:</strong> 개인정보분쟁조정위원회 (1833-6972, kopico.go.kr) / KISA 개인정보침해신고센터 (118, privacy.kisa.or.kr)</p>
              </div>
            </section>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>정보통신망법 및 개인정보보호법을 준수합니다.</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/terms" className="text-primary hover:underline font-semibold">
                서비스 이용약관 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
