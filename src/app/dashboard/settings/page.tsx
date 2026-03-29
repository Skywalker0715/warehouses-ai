import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ThemeSwitcher from "@/components/settings/ThemeSwitcher"

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Pengaturan"
        description="Atur tampilan dashboard dan preferensi akun."
      />

      <div className="mx-auto mt-6 w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tema Dashboard</CardTitle>
            <CardDescription>
              Pilih mode tampilan yang paling nyaman.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
