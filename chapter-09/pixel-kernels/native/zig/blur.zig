// The box blur from kernels.c, written in Zig and exported
// with the C ABI so Bun can load it with dlopen.
const std = @import("std");

fn blurPass(src: []const u8, dst: []u8, w: usize, h: usize,
            r: usize, horizontal: bool) void {
    const len = if (horizontal) w else h;
    const lines = if (horizontal) h else w;
    const step: usize = if (horizontal) 4 else w * 4;
    const jump: usize = if (horizontal) w * 4 else 4;
    const div: u32 = @intCast(2 * r + 1);
    for (0..lines) |line| {
        const base = line * jump;
        for (0..4) |c| {
            var sum: u32 = 0;
            var k: isize = -@as(isize, @intCast(r));
            while (k <= @as(isize, @intCast(r))) : (k += 1) {
                const last: isize = @intCast(len - 1);
                const j: usize = @intCast(std.math.clamp(k, 0, last));
                sum += src[base + j * step + c];
            }
            for (0..len) |i| {
                dst[base + i * step + c] = @intCast(sum / div);
                const drop = if (i < r) 0 else i - r;
                const next = @min(i + r + 1, len - 1);
                sum = sum + src[base + next * step + c]
                    - src[base + drop * step + c];
            }
        }
    }
}

export fn box_blur(src: ?[*]const u8, dst: ?[*]u8, w: u32, h: u32,
                   r: u32) i32 {
    const s = src orelse return -1;
    const d = dst orelse return -1;
    if (w == 0 or h == 0 or r == 0) return -1;
    const n = @as(usize, w) * h * 4;
    const tmp = std.heap.c_allocator.alloc(u8, n) catch return -2;
    defer std.heap.c_allocator.free(tmp);
    blurPass(s[0..n], tmp, w, h, r, true);
    blurPass(tmp, d[0..n], w, h, r, false);
    return 0;
}
