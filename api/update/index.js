export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const REPO = 'amplitudemodulada/construpro-erp'

    const releaseRes = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      {
        headers: {
          'User-Agent': 'ConstruPro-ERP-Updater',
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    )

    if (!releaseRes.ok) {
      return res.status(500).json({
        error: `GitHub API retornou ${releaseRes.status}`
      })
    }

    const release = await releaseRes.json()

    const asset = release.assets?.find(a => a.name.endsWith('.zip'))

    return res.status(200).json({
      version: release.tag_name.replace('v', ''),
      name: release.name,
      date: release.published_at,
      downloadUrl: asset?.browser_download_url || null,
      fileName: asset?.name || null,
      fileSize: asset?.size || 0,
      releaseNotes: release.body || ''
    })
  } catch (err) {
    return res.status(500).json({
      error: `Erro ao buscar atualização: ${err.message}`
    })
  }
}
