import Foundation
import Vision
import CoreImage
import AppKit

// usage: lift <input> <output.png> [instanceIndex|all]
let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
let which = args.count > 3 ? args[3] : "all"

guard let ci = CIImage(contentsOf: input) else { print("cannot read"); exit(1) }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci)
try handler.perform([req])
guard let obs = req.results?.first else { print("no subject"); exit(2) }
print("instances:", obs.allInstances.count)
var set = obs.allInstances
if which != "all", let i = Int(which) { set = IndexSet(integer: i) }
let buf = try obs.generateMaskedImage(ofInstances: set, from: handler, croppedToInstancesExtent: false)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: out, to: output, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
// also print per-instance masks bbox sizes
for i in obs.allInstances {
  let m = try obs.generateScaledMaskForImage(forInstances: IndexSet(integer: i), from: handler)
  let w = CVPixelBufferGetWidth(m), h = CVPixelBufferGetHeight(m)
  print("instance", i, w, h)
}
