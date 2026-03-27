① Change the nav link:
html<!-- BEFORE -->
<li><span class="nav-link" onclick="scrollToInvestor()">Investors</span></li>

<!-- AFTER -->
<li><span class="nav-link" onclick="showPage('investors')">Investors</span></li>
② Add the Investors page (paste after the closing </div> of the insights page, before </body>):
html<!-- Investors Page -->
<div id="investors" class="page">
    <section class="investor-section" style="color: white !important; min-height: 80vh;">
        <div class="investor-container">
            <div class="investor-grid">
                <div class="investor-left">
                    <h2 class="investor-title">Investor Partnerships</h2>
                    <h3 class="investor-headline">Build Assets.<br> Not Just Structures.</h3>
                    <p class="investor-description">
                        Alpha Line Group positions itself as a strategic development partner for investors seeking durable, income-generating real estate assets.
                    </p>
                    <p class="investor-description">
                        Our approach combines engineering discipline, structured financial feasibility, and market-aligned development strategies.
                    </p>
                    <div class="investor-button" onclick="showPage('contact')">
                        Discuss Investment Opportunities
                    </div>
                </div>
                <div class="investor-right">
                    <div class="investor-card">
                        <h4>Financial Feasibility</h4>
                        <p>Detailed financial modeling and structured feasibility studies before project execution begins.</p>
                    </div>
                    <div class="investor-card">
                        <h4>Cost-Optimized Construction</h4>
                        <p>Engineering-driven construction strategies designed to maximize capital efficiency.</p>
                    </div>
                    <div class="investor-card">
                        <h4>Rental Performance</h4>
                        <p>Developments structured for long-term rental income and durable asset value.</p>
                    </div>
                    <div class="investor-card">
                        <h4>Market-Aligned Development</h4>
                        <p>Projects designed around real demand, ensuring strong occupancy and investment sustainability.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <footer class="footer">
        <div class="footer-content" id="footerContentInvestors"></div>
        <div class="footer-bottom">
            <p>&copy; 2026 Alpha Line Construction. All rights reserved. | Developed by
                <a href="https://innovatoor.com" target="_blank" style="color: rgba(56,145,248,0.949) !important;">Innovatoor</a></p>
        </div>
    </footer>
</div>

app.js — 1 change
Find this line:
jsconst insightsFooter = document.getElementById('footerContentInsights');
if (insightsFooter) insightsFooter.innerHTML = footerHTML;
Add right after it:
jsconst investorsFooter = document.getElementById('footerContentInvestors');
if (investorsFooter) investorsFooter.innerHTML = footerHTML;
