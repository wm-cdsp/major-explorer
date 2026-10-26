"""Normalize the audited 2026–27 catalog research into the static explorer dataset."""
import json,re,pathlib,shutil
root=pathlib.Path(__file__).resolve().parents[1]
research=root/'research'
da=json.loads((research/'data-ai.json').read_text());cs=json.loads((research/'cs.json').read_text());bu=json.loads((research/'business.json').read_text())
courses={}
for code,c in bu['courses'].items():
 courses[code]={'code':code,'title':c['title'],'credits':c['credits'],'prerequisites':c.get('prerequisites') or 'None stated in the catalog.','corequisites':c.get('corequisites') or 'None stated in the catalog.','term':'Not specified','timingNote':c['offering'],'source':f'https://catalog.wm.edu/search/?P={code.replace(" ","%20")}'}
for c in cs['courses']:
 code=c['code'];courses[code]={'code':code,'title':c['title'],'credits':c['credits'],'prerequisites':c.get('prerequisites') or 'None stated in the catalog.','corequisites':c.get('corequisites') or 'None stated in the catalog.','term':'Not specified','timingNote':c.get('offering_note') or 'No season is stated in the catalog.','source':c.get('course_catalog_url',c['source'])}
 if c.get('notes'):courses[code]['notes']=c['notes']
for code,c in da['courses'].items():
 offering=c.get('offering',{});terms=offering.get('terms',[])
 courses[code]={'code':code,'title':c['name'],'credits':c.get('credits'),'prerequisites':c.get('prerequisitesText') or 'None stated in the catalog.','corequisites':c.get('corequisitesText') or 'None stated in the catalog.','term':' / '.join(terms).title() if terms else 'Not specified','timingNote':offering.get('text','No season is stated in the catalog.'),'source':c['source']}
 if c.get('notes'):courses[code]['notes']=c['notes']
 if c.get('status')=='unresolved-catalog-entry':
  courses[code]['unresolved']=True
  courses[code]['prerequisites']='Course record unresolved; confirm details with the department.'
  courses[code]['corequisites']='Course record unresolved; confirm details with the department.'
# Preserve topic restrictions on the requirement, not as blanket course equivalence.
programs=[]
def group(title,rule,ids,**kw):return {'title':title,'rule':rule,'courseIds':ids,**kw}
def dagroup(g):
 ids=g.get('courseIds',[]).copy();rule='';candidate=False
 if g['rule']=='all':rule='Complete every course below.'
 elif g['rule']=='choose_one':
  alts=g['alternatives'];ids=[c for a in alts for c in a];rule='Choose one route: '+' OR '.join(' + '.join(a) for a in alts)+'.'
 elif g['rule'] in ['choose_courses_and_credits','choose_courses_and_minimum_credits']:rule=f"Choose {g.get('choose',2)} courses totaling at least {g.get('minCredits',g.get('credits'))} credits."
 elif g['rule']=='minimum_courses_and_credits':
  rule=f"Choose at least {g['minCourses']} courses totaling at least {g['minCredits']} credits. DATA 300–400 level courses are eligible except DATA 480, 481 and 491, along with the approved courses listed below."
  op=g['openOptions'];ids+=sorted([c for c in courses if c.startswith('DATA ') and 300<=int(re.search(r'\d+',c)[0])<500 and c not in op['excluded']])
 elif g['rule']=='level_course':
  rule='Complete one 400-level DATA course (at least 3 credits), excluding DATA 491 and 495. DATA 496 may count only after successful honors completion. No overlap with track credits.'
  ids=sorted([c for c in courses if c.startswith('DATA ') and 400<=int(re.search(r'\d+',c)[0])<500 and c not in g['excluded']])
 elif g['rule']=='qualifying_courses':
  rule='Choose three DATA courses numbered 340 or higher (9 credits) with substantial dataset analysis. The courses below are candidates by number; course content and honors restrictions still require review. DATA 491 is excluded.'
  ids=sorted([c for c in courses if c.startswith('DATA ') and 340<=int(re.search(r'\d+',c)[0])<500 and c not in g['excluded']]);candidate=True
 elif g['rule']=='attribute_or_advisor_approved':rule='Complete 6 credits carrying the Applied AI attribute, or courses in other disciplines approved with your advisor. The program does not publish a closed course list.'
 notes=g.get('notes',[])
 return group(g['title'],rule,list(dict.fromkeys(ids)),notes=notes,candidates=candidate)
meta={
'data-science-minor':('ds-minor','Data Science','Minor','✺','Add the power of evidence to the field you already love.','18 minimum','analysis', ['Data-informed research','Domain analyst'],{'analysis':5,'impact':3,'business':1,'ai':2,'software':1,'spatial':2}),
'artificial-intelligence-minor':('ai-minor','Artificial Intelligence','Minor','✧','Give your major a technical foundation in machine learning and AI.','19 published','ai',['AI-informed specialist','Machine learning applications'],{'ai':5,'software':3,'analysis':3,'impact':2}),
'applied-artificial-intelligence':('aai','Applied Artificial Intelligence','BA','✧','Bring AI agents, research design, and responsible practice to another field.','30 published','impact',['AI workflow designer','AI application specialist','Responsible AI practitioner'],{'ai':4,'impact':5,'analysis':2,'business':2,'software':1}),
'data-science-bs':('ds','Data Science','BS','✺','Turn complex data into evidence, models, and a story that matters.','36 published','analysis',['Data scientist','Data analyst'],{'analysis':5,'ai':3,'impact':3,'spatial':2,'software':2})}
for p in da['programs']:
 family,title,degree,icon,summary,credits,focus,careers,tags=meta[p['id']]
 base={'id':p['id'],'family':family,'title':title,'degree':degree,'kind':'minor' if degree=='Minor' else 'major','icon':icon,'summary':summary,'credits':credits,'source':p['source'],'rules':p['rules'].copy(),'fit':p['fit']['summary'],'careers':careers,'tags':tags,'notes':[],'groups':[dagroup(g) for g in p['groups'] if g['rule']!='choose_track']}
 if p['id']=='artificial-intelligence-minor':base['notes']=['The 19-credit requirement omits prerequisites that may add coursework. In particular, DATA 301 requires DATA 201, accepted linear algebra, and DATA 210 or MATH 352.']
 if p['id']=='applied-artificial-intelligence':base['notes']=['DATA 210 and DATA 405 list DATA 101, CSCI 140 or CSCI 141 as prerequisites. Their entries do not list AAI 101; confirm an approved route with the department rather than assuming equivalence.', 'PHIL 150 must be the Philosophy of Technology topic identified in the program, not an arbitrary first-year seminar. That 4-credit route raises the listed 30-credit minimum to 31.']
 if p['id']=='data-science-minor':base['notes']=['Electives must total six credits across at least two courses. BUAD 352 is 1.5 credits, so any two approved electives will not automatically suffice. BUAD 351 is printed in the approved list without a resolvable course record.']
 if p.get('tracks'):
  for t in p['tracks']:
   v={**base,'id':'ds-'+t['id'],'track':t['name'],'fit':t['fit']['summary'],'groups':base['groups']+[dagroup(g) for g in t['groups']]}
   v['notes']=['The current BS requirements publish 36 hours and four tracks. The DS minor overview still describes an older 40-credit, three-track BS; this guide follows the BS requirements table.']
   if t['id']=='artificial-intelligence':v['tags']={**tags,'ai':6};v['careers']=['Data scientist','AI model developer']
   elif t['id']=='algorithms':v['tags']={**tags,'software':5};v['careers']=['Data infrastructure developer','Algorithm developer']
   elif t['id']=='spatial-data-analytics':v['tags']={**tags,'spatial':7};v['careers']=['Geospatial data analyst','Remote sensing analyst']
   elif t['id']=='data-application':v['tags']={**tags,'analysis':7,'impact':4};v['careers']=['Data scientist','Predictive analyst']
   programs.append(v)
 else:programs.append(base)
def csgroups(reqs):
 out=[]
 for g in reqs:
  if g['kind']=='select_concentration':continue
  if 'items' in g:
   ids=[x['course'] for x in g['items'] if 'course' in x]
   if ids:out.append(group(g['label'],'Complete every course below.',ids))
   for item in g['items']:
    if 'choose' in item:out.append(group(item.get('label','Mathematics route'),'Choose one: '+' OR '.join(item['courses'])+'.',item['courses']))
  else:
   title=g.get('label', 'Concentration electives' if g['kind']!='proficiency' else 'Probability / statistics proficiency')
   rule=g.get('course_rule',('Complete every course below.' if g['kind']=='all' else f"Choose {g.get('credits','the required')} credits from these options."))
   if g.get('count'):rule=f"Choose {g['count']} course ({g['credits']} credits)."
   if g.get('choose'):rule='Choose one course: '+' OR '.join(g['courses'])+'.'
   ids=g['courses'].copy();notes=[]
   for x in g.get('conditional_courses',[]):ids.append(x['course']);notes.append(x['course']+': '+x['condition'])
   out.append(group(title,rule,ids,notes=notes))
 return out
for p in cs['programs']:
 base={'id':p['id'],'family':'cs-minor' if p['id']=='cs-minor' else 'cs','title':'Computer Science','degree':'Minor' if p['id']=='cs-minor' else 'BS','kind':'minor' if p['id']=='cs-minor' else 'major','icon':'⌘','summary':'Understand computing from algorithms and data structures to the systems we rely on.','credits':'18–19' if p['id']=='cs-minor' else '36–37 major','source':p['source'],'rules':p.get('residency_rules',[])+[p['credit_note']],'fit':p.get('career_fit_inference',{}).get('text','Build a foundation in programming, algorithms, systems and software.'),'careers':['Software developer','Computing specialist'],'tags':{'software':6,'ai':2,'analysis':1,'security':2},'notes':[],'groups':csgroups(p['requirements'])}
 base['groups'].append(group('Required course-description corequisites','Complete these alongside the corresponding course; MATH 109L is listed in the course description rather than the degree table.',p['corequisites']))
 if p['id']=='cs-bs':
  base['rules'] += [p['catalog_planning_guidance'],'Major writing requirement: '+p['writing_requirement']]
  base['notes']=[p['credit_note']]
  for t in p['concentrations']:
   v={**base,'id':t['id'],'track':t['name'],'fit':t['career_fit_inference']['text'],'groups':base['groups']+csgroups(t['requirements'])}
   if t['id']=='cs-general':
    g=v['groups'][-1]
    g['courseIds']=[c for c in g['courseIds'] if c not in ['CSCI 301','CSCI 303','CSCI 304','CSCI 312','CSCI 423']]
    g['rule']='Choose 12 additional credits. '+g['rule']+' Required core courses cannot also supply these elective credits.'
   if t['id']=='cs-aiml':v['tags']={**base['tags'],'ai':7};v['careers']=['Machine learning engineer','AI software developer']
   if t['id']=='cs-cyber':v['tags']={**base['tags'],'security':8};v['careers']=['Security analyst','Secure systems developer']
   programs.append(v)
 else:programs.append(base)
for p in bu['programs']:
 groups=[]
 for g in p['groups']:
  groups.append(group(g['title'],g['rule'],[c['code'] for c in g['courses']],source=g['source'],candidates=g.get('selectionType')=='confirm-equivalency'))
 isds=p['id'].endswith('data-science')
 notes=[n['text'] for n in bu['catalogNotes'] if n['id'] in (['ds-major-credit-conflict','core-differences','calculus-equivalency'] if isds else ['core-differences','calculus-equivalency'])]
 programs.append({'id':p['id'],'family':'business','title':'Business Analytics','track':'Data Science' if isds else 'Supply Chain','degree':'BBA','kind':'major','icon':'↗','summary':'Connect analytical tools to business decisions, strategy, and organizational challenges.','credits':('29 core + 18 major' if isds else '28 core + 12 major')+' table','source':p['source'],'rules':p['rules'].copy(),'fit':'Develop business intelligence, predictive and prescriptive analytics.' if isds else 'Analyze operations, logistics and supply chains in a business curriculum.','careers':p['careerFit']['examples'],'tags':{'business':7,'analysis':4,'ai':2,'operations':2 if isds else 7},'notes':notes,'groups':groups,'optionalConcentrations':[group(g['title'],g['rule'],[c['code'] for c in g['courses']],notes=[g['catalogNote']] if g.get('catalogNote') else []) for g in p['optionalConcentrations']]})
# Required-topic annotation is scoped to Applied AI requirement, while general course title remains accurate.
for p in programs:
 if p['family']=='aai':
  for g in p['groups']:
   if 'PHIL 150' in g['courseIds']:g['notes'].append('PHIL 150: only the Philosophy of Technology topic identified by the program is the listed alternative (4 credits).')
 # Include linked labs in row-level notes for alternative pathways as well.
 if p['family'] in ['ds','ds-minor','ai-minor','aai']:
  p['rules']=p['rules'].copy()
  p['rules'].append('Course-description prerequisites and corequisites may add credits. If taking CSCI 141, include CSCI 141L (0 credits). If taking MATH 109, include MATH 109L (1 credit).')
# Unknown catalog-listed references remain visible, without made-up details.
for p in programs:
 for g in p['groups']+p.get('optionalConcentrations',[]):
  for c in g['courseIds']:
   if c not in courses:courses[c]={'code':c,'title':'Catalog-listed option — course record unresolved','credits':None,'prerequisites':'Course details need catalog/advisor confirmation.','corequisites':'Course details need catalog/advisor confirmation.','term':'Not specified','timingNote':'Course record unresolved. No offering season verified.','source':p['source'],'unresolved':True}
# Publish majors only; keep the audited research available for future catalog updates.
programs=[p for p in programs if p['kind']=='major']
major_sources={p['source'] for p in programs}
sources=[{'title':p.get('name',p.get('title')),'url':p['source']} for p in da['programs']+cs['programs']+bu['programs'] if p['source'] in major_sources]
for sub in ['data','csci','math','buad','gis','phil','biol','econ','govt','psyc']:sources.append({'title':sub.upper()+' course descriptions','url':f'https://catalog.wm.edu/undergraduate/courses/{sub}/'})
out={'edition':'2026–27','verified':'2026-10-20','programs':programs,'courses':courses,'sources':sources,'policy':'Catalog-only curriculum. Career fits are editorial interpretations. Common annual offering patterns cannot be inferred when the catalog does not state seasons. Checkmarks are personal notes, not a degree audit.'}
(root/'docs/curriculum.js').write_text('window.CURRICULUM = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'docs/curriculum-data.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(f"Built {len(programs)} routes in {len(set(p['family'] for p in programs))} families; {len(courses)} course records.")
print('Stated seasons:',[(c['code'],c['term']) for c in courses.values() if c['term']!='Not specified'])
print('Unresolved:',[c['code'] for c in courses.values() if c.get('unresolved')])
