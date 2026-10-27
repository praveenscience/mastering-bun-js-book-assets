// The box blur from kernels.c, written in Rust and exported
// with the C ABI so Bun can load it with dlopen.
use std::slice;

fn blur_pass(src: &[u8], dst: &mut [u8], w: usize, h: usize,
             r: usize, horizontal: bool) {
    let (len, lines) = if horizontal { (w, h) } else { (h, w) };
    let step = if horizontal { 4 } else { w * 4 };
    let jump = if horizontal { w * 4 } else { 4 };
    let div = (2 * r + 1) as u32;
    for line in 0..lines {
        let base = line * jump;
        for c in 0..4 {
            let at = |i: usize| base + i * step + c;
            let mut sum: u32 = 0;
            for k in -(r as isize)..=(r as isize) {
                let j = k.clamp(0, len as isize - 1) as usize;
                sum += src[at(j)] as u32;
            }
            for i in 0..len {
                dst[at(i)] = (sum / div) as u8;
                let drop = i.saturating_sub(r);
                let next = (i + r + 1).min(len - 1);
                sum = sum + src[at(next)] as u32
                    - src[at(drop)] as u32;
            }
        }
    }
}

/// # Safety
/// `src` and `dst` must each point to `w * h * 4` valid bytes.
#[no_mangle]
pub unsafe extern "C" fn box_blur(src: *const u8, dst: *mut u8,
                                  w: u32, h: u32, r: u32) -> i32 {
    if src.is_null() || dst.is_null() || w == 0 || h == 0 || r == 0 {
        return -1;
    }
    let n = w as usize * h as usize * 4;
    let src = slice::from_raw_parts(src, n);
    let dst = slice::from_raw_parts_mut(dst, n);
    let mut tmp = vec![0u8; n];
    let (w, h, r) = (w as usize, h as usize, r as usize);
    blur_pass(src, &mut tmp, w, h, r, true);
    blur_pass(&tmp, dst, w, h, r, false);
    0
}
