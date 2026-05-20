import { useState } from 'react'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { supabase } from '../services/supabase'

type ReportType = 'transactions' | 'inventory' | 'abc'

interface ExportOptions {
  report:     ReportType
  from_date?: string
  to_date?:   string
}

interface ExportResult {
  success:  boolean
  fileName?: string
  rows?:     number
  error?:    string
}

export function useExport() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')

  async function exportReport(options: ExportOptions): Promise<ExportResult> {
    setLoading(true)
    setProgress('Gerando relatório...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return { success: false, error: 'Não autenticado' }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!

      setProgress('Conectando ao servidor...')
      const res = await fetch(`${supabaseUrl}/functions/v1/export-report`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(options),
      })

      const json = await res.json()
      if (!res.ok) {
        return { success: false, error: json.error ?? 'Erro ao gerar relatório' }
      }

      const { url, fileName, rows } = json

      setProgress('Baixando arquivo...')

      // Download do arquivo para o diretório de cache
      const localPath = `${FileSystem.cacheDirectory}${fileName}`
      const { status } = await FileSystem.downloadAsync(url, localPath)

      if (status !== 200) {
        return { success: false, error: 'Falha ao baixar o arquivo' }
      }

      setProgress('Abrindo compartilhamento...')

      // Verifica se sharing está disponível
      const isAvailable = await Sharing.isAvailableAsync()
      if (!isAvailable) {
        return { success: false, error: 'Compartilhamento não disponível neste dispositivo' }
      }

      await Sharing.shareAsync(localPath, {
        mimeType:   'text/csv',
        dialogTitle: `Exportar ${fileName}`,
        UTI:        'public.comma-separated-values-text',
      })

      return { success: true, fileName, rows }
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Erro desconhecido' }
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return { exportReport, loading, progress }
}
