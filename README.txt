Lingcam website (for GitHub + Vercel)
- Put everything in this folder in your GitHub repo (lingcam), then import it on vercel.com. No build step.
- Share links ("Copy a link") need Upstash Redis: in Vercel open Storage -> Create -> Upstash (Redis), connect it to this project, then Redeploy.
  Check it at https://YOUR-SITE.vercel.app/api/share?status  -> {"storage":"redis"}
- Put the APK in this folder too (Lingcam-x_y_z.apk) and keep version.json up to date; the apps read it to find updates.
