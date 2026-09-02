#!/usr/bin/env bash
# A/B 关键姿态 -> 快速运动补偿过渡 -> A-B-A 无缝循环 GIF
set -e
POSES=/home/user/.super_doubao/super-doubao-runtime/workspace/nook-fit/public/poses
OUT=/home/user/.super_doubao/super-doubao-runtime/workspace/nook-fit/public/gifs
TMP=/tmp/nookgif
mkdir -p "$OUT" "$TMP"
SIZE=400
FPS=20
HOLD=0.32      # 关键姿态保持时长
TRANS=0.18     # 过渡时长（快速，弱化插值形变）

for name in squat jack pushup plank lunge crunch knees stretch bridge climber wallsit tap calf twist birdog superman; do
  cd "$TMP" && rm -f ah.mp4 bh.mp4 ab.mp4 ba.mp4 full.mp4
  A=$POSES/${name}_a.png
  B=$POSES/${name}_b.png

  # A/B 保持段
  ffmpeg -y -loglevel error -loop 1 -t $HOLD -r $FPS -i "$A" -vf "scale=$SIZE:$SIZE:flags=lanczos" -pix_fmt yuv420p ah.mp4
  ffmpeg -y -loglevel error -loop 1 -t $HOLD -r $FPS -i "$B" -vf "scale=$SIZE:$SIZE:flags=lanczos" -pix_fmt yuv420p bh.mp4

  # A->B 运动补偿过渡
  ffmpeg -y -loglevel error -loop 1 -t 0.09 -r $FPS -i "$A" -loop 1 -t 0.09 -r $FPS -i "$B" \
    -filter_complex "[0:v]scale=$SIZE:$SIZE:flags=lanczos[a];[1:v]scale=$SIZE:$SIZE:flags=lanczos[b];[a][b]concat=n=2:v=1,minterpolate=fps=$FPS:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1[morph]" \
    -map "[morph]" -pix_fmt yuv420p ab.mp4
  # B->A 反向过渡
  ffmpeg -y -loglevel error -i ab.mp4 -vf reverse -an ba.mp4

  printf "file 'ah.mp4'\nfile 'ab.mp4'\nfile 'bh.mp4'\nfile 'ba.mp4'\n" > list.txt
  ffmpeg -y -loglevel error -f concat -safe 0 -i list.txt -c copy full.mp4

  # 高质量 GIF 调色板
  ffmpeg -y -loglevel error -i full.mp4 -vf "split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4" "$OUT/${name}.gif"
  echo "done $name $(du -h "$OUT/${name}.gif" | cut -f1)"
done
ls -la "$OUT"
