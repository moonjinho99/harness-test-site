import { AtSign, Camera, Globe, MessageCircle, ShoppingBag } from "lucide-react"

import { Separator } from "@/components/ui/separator"

const LINK_COLUMNS = [
  {
    title: "고객센터",
    links: ["자주 묻는 질문", "1:1 문의", "공지사항", "이용약관"],
  },
  {
    title: "서비스",
    links: ["배송 안내", "교환 및 반품", "포인트 안내", "쿠폰 사용"],
  },
  {
    title: "회사소개",
    links: ["브랜드 스토리", "채용 정보", "제휴 문의", "IR 자료"],
  },
]

const SOCIAL_LINKS = [
  { icon: Camera, href: "#instagram", label: "인스타그램" },
  { icon: AtSign, href: "#threads", label: "스레드" },
  { icon: MessageCircle, href: "#kakao", label: "카카오톡 채널" },
  { icon: Globe, href: "#site", label: "브랜드 사이트" },
]

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <a href="#home" className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <ShoppingBag className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                노바<span className="text-indigo-600">몰</span>
              </span>
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              엄선된 브랜드와 취향 있는 큐레이션으로,
              <br />
              매일의 쇼핑을 조금 더 특별하게.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    aria-label={social.label}
                    className="flex size-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-indigo-200 hover:bg-background hover:text-indigo-600 dark:hover:border-indigo-800/60"
                  >
                    <Icon className="size-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {LINK_COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold tracking-tight">
                {column.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href={`#${link}`}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p>
              (주)노바몰 · 대표 김노바 · 사업자등록번호 123-45-67890 · 통신판매업신고 2026-서울강남-1234
            </p>
            <p>서울특별시 강남구 테헤란로 123, 4층 · 고객센터 1588-0000 (평일 09:00 ~ 18:00)</p>
          </div>
          <p className="shrink-0">© 2026 NovaMall. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}