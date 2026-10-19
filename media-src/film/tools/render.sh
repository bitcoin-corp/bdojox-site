#!/bin/sh
# parallel chunked render (composition is seekable), then lossless concat
cd "$(dirname "$0")/.." && mkdir -p work
W=$1; H=$2; N=$3; OUT=$4; NF=960; step=$(( (NF + N - 1) / N )); : > work/list-$W.txt
for i in $(seq 0 $((N-1))); do a=$((i*step)); b=$((a+step)); [ $b -gt $NF ] && b=$NF
  python3 tools/comp.py $W $H work/c-$W-$i.mp4 --frames $a:$b 2>/dev/null & echo "file 'c-$W-$i.mp4'" >> work/list-$W.txt; done; wait
ffmpeg -v error -y -f concat -safe 0 -i work/list-$W.txt -c copy "$OUT"
