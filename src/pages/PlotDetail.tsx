import { useParams } from 'react-router-dom';

export default function PlotDetail() {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-brand-800">Detail Plot</h1>
      <p className="text-slate-600">Plot ID: {id}</p>
      {/* TODO: sprint-5/6 owner FS — render KartuCard, HashChainViewer, ConsentPanel */}
    </div>
  );
}
