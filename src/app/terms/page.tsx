import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "서비스 이용약관",
  description: "Nexus 학생회 통합 운영체제 서비스 이용약관",
};

export default function TermsPage() {
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
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <FileText className="size-3.5" />
              <span>이용약관</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Nexus 서비스 이용약관
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              본 약관은 Nexus 학생회 통합 운영체제(이하 &quot;서비스&quot;)의 이용과 관련하여
              서비스 제공 주체와 이를 이용하는 학생회 및 회원의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
            </p>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-foreground/90 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제1조 (목적)</h2>
              <p>
                본 약관은 대학 학생 자치기구의 투명하고 체계적인 업무 인수인계 및 자치 행정을 지원하는
                Nexus(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 이용자와 서비스 간의 권리·의무 관계를 규정함을 목적으로 합니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제2조 (용어의 정의)</h2>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>
                  <strong className="text-foreground">&quot;서비스&quot;</strong>라 함은 단과대/총학생회 조직 관리, 프로젝트 및 일정 관리, 예결산 회계 관리, 전자결재, 축제/행사 티켓 신청 및 검표, 학생 소통 피드 등을 제공하는 Nexus 플랫폼을 의미합니다.
                </li>
                <li>
                  <strong className="text-foreground">&quot;학생회(기구)&quot;</strong>라 함은 대학 내 공식 인가된 총학생회, 단과대 학생회, 학과 학생회 및 특별자치기구 등 본 서비스에서 조직(Tenant)을 개설하여 관리하는 자치 주체를 의미합니다.
                </li>
                <li>
                  <strong className="text-foreground">&quot;회원&quot;</strong>이라 함은 서비스에 접속하여 본 약관에 동의하고, 학생회 조직에 참여하거나 서비스를 이용하는 자를 말합니다.
                </li>
                <li>
                  <strong className="text-foreground">&quot;학생회원(임원)&quot;</strong>이라 함은 학생회 관리자의 승인을 거쳐 학생회의 내부 업무, 회계, 결재, 행사 관리 권한을 부여받은 회원을 말합니다.
                </li>
                <li>
                  <strong className="text-foreground">&quot;일반 이용자(학우)&quot;</strong>라 함은 별도의 학생회 임원 승인 없이 학생회가 주최하는 행사에 참가 신청을 하거나 학생 청원, 투표, 공지사항 조회에 참여하는 학우를 말합니다.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제3조 (약관의 효력 및 변경)</h2>
              <p>
                1. 본 약관은 서비스 화면에 게시하거나 전자우편 등의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
              </p>
              <p>
                2. 서비스는 필요한 경우 관련 법령(약관의 규제에 관한 법률, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등)을 위배하지 않는 범위 내에서 약관을 개정할 수 있으며, 변경 사항은 적용 7일 전(중대한 변경의 경우 30일 전) 공지합니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제4조 (회원가입 및 이용 승인)</h2>
              <p>
                1. 이용자는 서비스가 정한 소정의 가입 양식에 따라 정보를 기입한 후 본 약관 및 개인정보 처리방침에 동의함으로써 가입을 신청합니다.
              </p>
              <p>
                2. 학생회 조직 가입 신청 시에는 각 학생회 관리자(회장단)의 승인 절차를 거치며, 관리자가 승인하기 전까지는 내부 기밀 자료(예결산 세부 내역, 전자결재 원문, 회의록 등)에 대한 조회가 제한됩니다.
              </p>
              <p>
                3. 타인의 명의나 학번을 도용하거나 허위 사실을 기재한 경우 사전 통보 없이 이용이 제한되거나 법적 조치가 취해질 수 있습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제5조 (서비스의 제공 및 책임 분계)</h2>
              <p>
                1. 서비스는 안정적인 플랫폼 제공 및 데이터 인수인계 저장을 위한 기술적 환경을 제공합니다.
              </p>
              <p>
                2. 학생회가 등록한 예결산 장부, 회의록 요약, 지출 결의서, 행사 기획안의 사실성 및 적법성에 대한 책임은 해당 학생회 관리자 및 작성자 본인에게 있습니다.
              </p>
              <p>
                3. 축제/행사 티켓 발권 및 현장 입장 관리와 관련한 모든 현장 분쟁(티켓 양도, 취소, 환불 등)은 해당 행사를 주관하는 학생회의 규정을 따릅니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제6조 (개인정보 보호)</h2>
              <p>
                서비스는 회원의 개인정보를 소중하게 보호하며, 관련 법령 및 서비스의 <Link href="/privacy" className="text-primary underline font-medium">개인정보 처리방침</Link>에 따라 개인정보를 수집·이용·보관·파기합니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제7조 (회원의 의무 및 금지사항)</h2>
              <p>회원은 다음 각 호의 행위를 하여서는 아니 됩니다:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>타인의 계정 정보, 학번, 이메일, 전화번호를 도용하는 행위</li>
                <li>학생회 내부 미공개 문서 또는 회계 적격 증빙을 무단으로 외부에 유출하는 행위</li>
                <li>캠퍼스 청원 또는 라이브 투표 시 비정상적인 매크로나 다중 계정을 동원하여 결과를 조작하는 행위</li>
                <li>서비스의 시스템 및 스토리지에 악성 코드를 유포하거나 고의로 과부하를 유발하는 행위</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제8조 (면책 조항)</h2>
              <p>
                1. 서비스는 천재지변, 정전, 디도스(DDoS) 공격, 클라우드 인프라 제공자(Supabase, Vercel 등)의 불가항력적 장애로 인한 일시적 서비스 중단에 대해 고의나 중과실이 없는 한 책임을 지지 않습니다.
              </p>
              <p>
                2. 서비스는 학생회가 서비스에 등록한 자료의 정확성이나 신뢰성에 관하여 보증하지 아니하며, 회원 간 또는 회원과 제3자 간에 발생한 분쟁에 개입할 의무가 없습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-foreground">제9조 (준거법 및 관할법원)</h2>
              <p>
                본 약관과 관련하여 발생하는 모든 분쟁은 대한민국 법률을 준거법으로 하며, 소송이 제기될 경우 민사소송법상의 관할법원에 제기합니다.
              </p>
            </section>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Nexus는 대학 학생 자치 규약 및 개인정보보호법 표준을 준수합니다.</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="text-primary hover:underline font-semibold">
                개인정보 처리방침 보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
