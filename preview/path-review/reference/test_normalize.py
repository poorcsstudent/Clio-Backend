import unittest
import normalize as n

class ReferenceTests(unittest.TestCase):
    def test_distances_and_projection(self):
        self.assertEqual(n.distance([0,0],[0,0]),0)
        self.assertAlmostEqual(n.distance([0,0],[0,1]),111195.08,places=1)
        self.assertAlmostEqual(n.nearest([0,0],[-.001,0],[.001,0]),0)
    def test_access_exclusions(self):
        for tags in ({'highway':'footway','foot':'no'},{'highway':'path','access':'private'}):
            self.assertEqual(n.classify(tags),'restricted-excluded')
        self.assertEqual(n.classify({'highway':'service','sidewalk':'both'}),'background-not-pedestrian-centerline')
        self.assertEqual(n.classify({'highway':'cycleway'}),'cycleway-foot-access-unconfirmed')
        self.assertEqual(n.classify({'highway':'pedestrian','area':'yes'}),'area-not-centerline')
    def test_no_geometric_crossing_snap(self):
        raw={'elements':[{'type':'way','id':1,'tags':{'highway':'footway'},'nodes':[1,2],'geometry':[{'lon':0,'lat':0},{'lon':.002,'lat':0}]},
                         {'type':'way','id':2,'tags':{'highway':'footway'},'nodes':[3,4],'geometry':[{'lon':.001,'lat':-.001},{'lon':.001,'lat':.001}]}]}
        _,g,_=n.osm_layers(raw)
        self.assertEqual(len(g['nodes']),4)
        self.assertEqual(len(g['edges']),2)
        self.assertTrue(all(e['routingEligible'] is False for e in g['edges']))
    def test_barrier_tags_preserved(self):
        raw={'elements':[{'type':'node','id':1,'lon':0,'lat':0,'tags':{'barrier':'gate','access':'private'}},
            {'type':'way','id':5,'tags':{'highway':'footway'},'nodes':[1,2],'geometry':[{'lon':0,'lat':0},{'lon':.001,'lat':0}]}]}
        _,g,_=n.osm_layers(raw)
        self.assertEqual(g['nodes'][0]['tags']['access'],'private')
        self.assertFalse(g['edges'][0]['routingEligible'])
    def test_download_integrity_and_local_outputs(self):
        manifest=n.json.loads((n.ROOT/'source-manifest.json').read_text())
        for s in manifest['sources']:
            self.assertEqual(s['status'],'downloaded')
            self.assertEqual(n.hashlib.sha256((n.ROOT/s['file']).read_bytes()).hexdigest(),s['sha256'])
        g=n.json.loads((n.ROOT/'reference-graph.json').read_text()); nodes={v['id']:v for v in g['nodes']}
        self.assertEqual(len(nodes),len(g['nodes']))
        for e in g['edges']:
            self.assertEqual(e['coordinates'][0],nodes[e['from']]['coordinate'])
            self.assertEqual(e['coordinates'][-1],nodes[e['to']]['coordinate'])
            self.assertGreater(e['lengthMeters'],0)
            self.assertFalse(e['routingEligible'])
            self.assertEqual(e['displayTraceKeys'],[])
        candidates=n.json.loads((n.ROOT/'entrance-candidates.json').read_text())
        for entry in candidates:
            self.assertEqual(entry['status'],'REVIEW_ONLY_DO_NOT_AUTO_CONNECT')
            self.assertTrue(all(c['gapMeters']<=30 for c in entry['candidates']))

if __name__=='__main__': unittest.main()
