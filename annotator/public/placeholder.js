export default function PlaceholderImage() {
  return (
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0" />
      <rect x="200" y="150" width="400" height="300" fill="#ddd" stroke="#999" strokeDasharray="5,5" />
      <text x="400" y="300" textAnchor="middle" fontFamily="Arial" fontSize="24" fill="#666">
        Image Placeholder
      </text>
      <text x="400" y="330" textAnchor="middle" fontFamily="Arial" fontSize="16" fill="#888">
        800 × 600
      </text>
    </svg>
  );
}